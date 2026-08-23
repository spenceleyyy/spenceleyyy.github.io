"""
The researcher-facing coding window. Since codes now match to
utterances RETROACTIVELY (see run_realtime.py -- transcription lags
behind real speech, so a code can't wait for a "currently pending"
utterance that doesn't exist yet), this shows a live log of recent
code events and their matching status instead of a single banner:

  [12.3s] Pointing to person -- matching...
  [12.3s] Pointing to person -- matched: "We need to look at this"
  [40.1s] Gaze aversion -- no utterance found (timed out)

Key handling happens centrally in run_realtime.py's main loop (one
cv2.waitKey() drives all windows) -- this class only renders.
"""

import cv2
import numpy as np

import config_realtime as cfg
from codebook import CODES


class CodingWindow:
    def __init__(self):
        self.mode = "auto"
        self.recent_events = []  # list of event dicts (see run_realtime.py),
                                   # newest last -- rendered in reverse
        self._last_interpretation = None
        cv2.namedWindow(cfg.CODING_WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(cfg.CODING_WINDOW_NAME, *cfg.CODING_WINDOW_SIZE)
        self.render()

    def set_mode(self, mode: str):
        self.mode = mode
        self.render()

    def add_event(self, event: dict):
        """Called the instant a code is pressed -- event is a mutable
        dict from run_realtime.py, so later status changes (matched/
        unmatched) show up automatically next render() without needing
        a separate update call."""
        self.recent_events.append(event)
        self.recent_events = self.recent_events[-cfg.TRANSCRIPT_MAX_LINES:]
        self.render()

    def refresh(self):
        """Call this whenever an event's status changes (matched/
        timed out) so the window redraws with the new state."""
        self.render()

    def show_interpretation(self, text: str):
        self._last_interpretation = text
        self.render()

    def render(self):
        width, height = cfg.CODING_WINDOW_SIZE
        canvas = np.full((height, width, 3), 25, dtype=np.uint8)

        mode_color = (100, 220, 100) if self.mode == "manual" else (100, 180, 255)
        cv2.putText(canvas, f"MODE: {self.mode.upper()}  (press 'm' to toggle -- "
                             f"controls auto-camera on flags only; coding always active)",
                    (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, mode_color, 1, cv2.LINE_AA)
        cv2.line(canvas, (0, 35), (width, 35), (70, 70, 70), 1)

        y = 60
        cv2.putText(canvas, "CODES:", (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (200, 200, 200), 1, cv2.LINE_AA)
        y += 24
        for code in CODES:
            cv2.putText(canvas, f"  [{code['key']}]  {code['label']}", (15, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (210, 210, 210), 1, cv2.LINE_AA)
            y += 22

        y += 10
        cv2.line(canvas, (0, y), (width, y), (70, 70, 70), 1)
        y += 25

        cv2.putText(canvas, "RECENT CODES (matching happens once the delayed", (15, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 150, 150), 1, cv2.LINE_AA)
        y += 18
        cv2.putText(canvas, "transcript for that moment arrives):", (15, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 150, 150), 1, cv2.LINE_AA)
        y += 24

        for event in reversed(self.recent_events[-6:]):
            status = event.get("status", "matching")
            ts = event["timestamp"]
            label = event["label"]

            if status == "matching":
                line1 = f'[{ts:.1f}s] {label} -- matching...'
                color = (180, 180, 100)
                cv2.putText(canvas, line1, (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                            0.48, color, 1, cv2.LINE_AA)
                y += 22
            elif status == "matched":
                line1 = f'[{ts:.1f}s] {label} -- matched:'
                color = (140, 220, 140)
                cv2.putText(canvas, line1, (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                            0.48, color, 1, cv2.LINE_AA)
                y += 20
                utt_text = f'  "{event.get("matched_text", "")}"'
                cv2.putText(canvas, utt_text[:80], (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                            0.44, (200, 200, 200), 1, cv2.LINE_AA)
                y += 22
            else:  # unmatched / timed out
                line1 = f'[{ts:.1f}s] {label} -- no utterance found (timed out)'
                color = (150, 100, 100)
                cv2.putText(canvas, line1, (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                            0.46, color, 1, cv2.LINE_AA)
                y += 22

        y += 10
        cv2.line(canvas, (0, y), (width, y), (70, 70, 70), 1)
        y += 25

        if self._last_interpretation:
            cv2.putText(canvas, "LATEST INTERPRETATION:", (15, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 220, 100), 1, cv2.LINE_AA)
            y += 22
            text = self._last_interpretation
            for i in range(0, len(text), 85):
                if y > height - 15:
                    break
                cv2.putText(canvas, text[i:i + 85], (15, y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (210, 210, 210), 1, cv2.LINE_AA)
                y += 20

        cv2.imshow(cfg.CODING_WINDOW_NAME, canvas)

    def close(self):
        cv2.destroyWindow(cfg.CODING_WINDOW_NAME)
        cv2.waitKey(1)
