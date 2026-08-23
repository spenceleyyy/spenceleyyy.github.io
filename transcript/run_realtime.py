"""
Live pipeline. Key change from earlier versions: codes are no longer
matched to a "currently pending" utterance live, because transcription
lags 3-5s behind real speech -- by the time you press a code key for
what you're saying RIGHT NOW, the utterance covering that moment
hasn't been transcribed yet. So instead:

  1. Every code press is logged immediately with its real timestamp,
     status = "matching".
  2. When a (delayed) utterance eventually arrives, we check its
     [start, end] window (+ padding) against all still-unmatched code
     events. Any that fall inside get retroactively attached to that
     utterance -- this is what actually keeps codes and speech synced,
     rather than trying to line them up live.
  3. Once codes attach to an utterance, that utterance + a window of
     preceding conversation get sent to Claude for interpretation, so
     it has context to guess what an ambiguous "this"/"that" refers to.
  4. If a code never finds a matching utterance within
     CODE_MATCH_MAX_WAIT_SEC, it's logged standalone instead of left
     hanging forever.

'm' still toggles auto-mode (camera+LLM on a FLAGGED utterance) on/off
-- that's independent of manual coding, which is always active now.

Run with:  python run_realtime.py
Stop with: 'q'/Esc in a window, or Ctrl+C
"""

import sys
import time
import json
import queue
import threading
from concurrent.futures import ThreadPoolExecutor

import cv2

sys.stdout.reconfigure(line_buffering=True)

import config_realtime as cfg
from codebook import CODES
from audio_capture import AudioCapture
from streaming_transcribe import StreamingTranscriber
from flag_utterances_realtime import score_utterance
from video_ondemand import capture_on_demand
from interpret_realtime import interpret, interpret_manual_codes
from transcript_window import TranscriptWindow
from coding_window import CodingWindow


session_log = []
log_lock = threading.Lock()
CODE_LOOKUP = {c["key"]: c["label"] for c in CODES}


def transcription_worker(transcriber: StreamingTranscriber, out_queue: queue.Queue,
                          stop_event: threading.Event):
    while not stop_event.is_set():
        for u in transcriber.poll():
            out_queue.put(u)
        time.sleep(0.1)


def handle_flagged_utterance_auto(utterance, executor):
    """Auto mode: open camera, sample frames, interpret via LLM. Unchanged,
    independent of manual coding."""
    print(f"\n--- FLAGGED [auto]: \"{utterance['text']}\" -- opening camera ---")
    frames = capture_on_demand()

    def _interpret_async():
        try:
            interpretation = interpret(
                utterance["speaker"], utterance["text"],
                utterance["context_dependency_score"], utterance["deictic_density"],
                frames,
            )
        except Exception as e:
            print(f"\n  [INTERPRETATION FAILED]: {type(e).__name__}: {e}\n")
            return
        print(f"\n  interpretation: {interpretation}\n")
        with log_lock:
            utterance["llm_interpretation"] = interpretation

    executor.submit(_interpret_async)


def interpret_codes_now(utterance, context, executor, interpretation_queue):
    """Sends the utterance + its matched codes + preceding context to
    Claude for a text-only interpretation."""
    labels = [c["label"] for c in utterance["manual_codes"]]
    if not labels:
        return

    print(f"\n--- Interpreting: \"{utterance['text']}\" (codes: {', '.join(labels)}) ---")

    def _interpret_async():
        try:
            interpretation = interpret_manual_codes(
                utterance["speaker"], utterance["text"], labels, context=context,
            )
        except Exception as e:
            print(f"\n  [INTERPRETATION FAILED]: {type(e).__name__}: {e}\n")
            interpretation_queue.put(f"[interpretation failed: {e}]")
            return

        print(f"\n  interpretation: {interpretation}\n")
        with log_lock:
            utterance["manual_code_interpretation"] = interpretation
        interpretation_queue.put(interpretation)

    executor.submit(_interpret_async)


def match_code_events(utterance, pending_code_events):
    """
    Checks utterance's [start, end] window (+ padding) against all
    still-unmatched code events. Matches get attached to the utterance
    AND removed from pending_code_events. Matching mutates each event
    dict in place (status/matched_text), which is enough for the
    coding window to pick up the change on its next render() -- no
    separate window update call needed since it holds the same dict
    by reference.
    """
    window_start = utterance["start"] - cfg.CODE_MATCH_PADDING_SEC
    window_end = utterance["end"] + cfg.CODE_MATCH_PADDING_SEC

    matched_any = False
    for event in list(pending_code_events):  # copy -- we remove while iterating
        if window_start <= event["timestamp"] <= window_end:
            utterance["manual_codes"].append({
                "code": event["code"], "label": event["label"],
                "logged_at": event["timestamp"],
            })
            event["status"] = "matched"
            event["matched_text"] = utterance["text"]
            pending_code_events.remove(event)
            matched_any = True

    return matched_any


def sweep_stale_events(pending_code_events, now, session_log):
    """Codes that never found a matching utterance in time get logged
    standalone instead of left waiting forever."""
    for event in list(pending_code_events):
        if now - event["timestamp"] > cfg.CODE_MATCH_MAX_WAIT_SEC:
            event["status"] = "unmatched"
            pending_code_events.remove(event)
            with log_lock:
                session_log.append({
                    "type": "freeform_code", "code": event["code"],
                    "label": event["label"], "timestamp": event["timestamp"],
                })


def main():
    session_start = time.time()

    input("\nBefore starting: click the microphone icon in your menu bar "
          "and switch Mic Mode (e.g. Standard -> Voice Isolation, or back), "
          "if you've had silent-audio issues before. Press Enter when ready...")

    print("Starting audio capture...")
    audio = AudioCapture(session_start)
    audio.start()

    print("Loading transcription model (this can take a moment)...")
    transcriber = StreamingTranscriber(audio)

    utterance_queue = queue.Queue()
    stop_event = threading.Event()
    threading.Thread(
        target=transcription_worker,
        args=(transcriber, utterance_queue, stop_event),
        daemon=True,
    ).start()

    executor = ThreadPoolExecutor(max_workers=cfg.MAX_CONCURRENT_INTERPRETATIONS)

    transcript_window = TranscriptWindow()
    coding_window = CodingWindow()

    mode = cfg.DEFAULT_MODE
    coding_window.set_mode(mode)

    transcript_history = []      # recent utterances, for interpretation context
    pending_code_events = []     # codes awaiting a matching utterance
    interpretation_queue = queue.Queue()

    def status_text():
        return f"Listening... mode={mode} (press 'm' to toggle, 'q' to stop)"

    transcript_window.set_status(status_text())

    print(f"Live. Mode = {mode}. Coding is always active -- press a code key "
          f"anytime, it'll match to the utterance once transcribed. "
          f"'m' toggles auto-camera-on-flag, 'q'/Esc to stop.\n")

    try:
        while True:
            try:
                while True:  # drain everything currently queued
                    u = utterance_queue.get_nowait()
                    u["speaker"] = cfg.SPEAKER_NAME
                    u["manual_codes"] = []
                    flags = score_utterance(u["text"])
                    u.update(flags)

                    transcript_window.add_line(u["speaker"], u["text"], u["flagged"])
                    print(f"[{u['speaker']} @ {u['start']:.1f}s] {u['text']}"
                          + ("  <-- FLAGGED" if u["flagged"] else ""))

                    with log_lock:
                        session_log.append(u)
                    transcript_history.append(u)
                    del transcript_history[:-cfg.CONTEXT_WINDOW_UTTERANCES * 3]  # loose cap

                    if match_code_events(u, pending_code_events):
                        coding_window.refresh()
                        context = [
                            {"speaker": h["speaker"], "text": h["text"]}
                            for h in transcript_history[-(cfg.CONTEXT_WINDOW_UTTERANCES + 1):-1]
                        ]
                        interpret_codes_now(u, context, executor, interpretation_queue)

                    if mode == "auto" and u["flagged"]:
                        handle_flagged_utterance_auto(u, executor)

            except queue.Empty:
                pass

            sweep_stale_events(pending_code_events, time.time() - session_start, session_log)

            # --- Centralized key handling for both windows ---
            key = cv2.waitKey(1) & 0xFF
            if key != 255:
                char = chr(key) if key < 128 else ""

                if char in ("q",) or key == 27:
                    print("\nQuit requested.")
                    break

                elif char == "m":
                    mode = "manual" if mode == "auto" else "auto"
                    coding_window.set_mode(mode)
                    transcript_window.set_status(status_text())
                    print(f"  >> mode switched to: {mode}")

                elif char == "x":
                    # Manual flush: force any currently-waiting codes to
                    # stop waiting and log as standalone right now.
                    flushed = 0
                    for event in list(pending_code_events):
                        event["status"] = "unmatched"
                        pending_code_events.remove(event)
                        with log_lock:
                            session_log.append({
                                "type": "freeform_code", "code": event["code"],
                                "label": event["label"], "timestamp": event["timestamp"],
                            })
                        flushed += 1
                    coding_window.refresh()
                    print(f"  >> flushed {flushed} pending code event(s) as unmatched")

                elif char in CODE_LOOKUP:
                    label = CODE_LOOKUP[char]
                    timestamp = time.time() - session_start
                    event = {
                        "timestamp": timestamp, "code": char, "label": label,
                        "status": "matching", "matched_text": None,
                    }
                    pending_code_events.append(event)
                    coding_window.add_event(event)
                    print(f"  >> logged code [{char}] {label} @ {timestamp:.1f}s "
                          f"(awaiting matching utterance)")

            try:
                while True:
                    interp = interpretation_queue.get_nowait()
                    coding_window.show_interpretation(interp)
            except queue.Empty:
                pass

            transcript_window.render()

    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        stop_event.set()
        audio.stop()
        transcript_window.close()
        coding_window.close()
        executor.shutdown(wait=True)

        out_path = "session_log.json"
        with open(out_path, "w") as f:
            json.dump(session_log, f, indent=2)
        print(f"Session log saved to {out_path}")


if __name__ == "__main__":
    main()
