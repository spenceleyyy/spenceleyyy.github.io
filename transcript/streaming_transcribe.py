"""
Near-real-time transcription: accumulates audio into overlapping
windows and transcribes each with faster-whisper as it fills.

NOTE on "near": this batches every CHUNK_DURATION_SEC seconds rather
than doing true token-level streaming. That's a deliberate
simplification -- true streaming ASR (e.g. the "local agreement"
approach used by the whisper_streaming project) is more complex and
you can layer it in later if this granularity isn't tight enough for
your use case. This version gives you a new transcribed segment
roughly every CHUNK_DURATION_SEC seconds, which is a reasonable
starting resolution for flagging purposes.
"""

import numpy as np
from faster_whisper import WhisperModel

import config_realtime as cfg
from audio_capture import AudioCapture


class StreamingTranscriber:
    def __init__(self, audio_capture: AudioCapture):
        self.audio_capture = audio_capture
        self.model = WhisperModel(
            cfg.WHISPER_MODEL_SIZE,
            compute_type=cfg.WHISPER_COMPUTE_TYPE,
            cpu_threads=4,  # bump this up if you have more cores free;
                             # faster-whisper defaults conservatively
        )
        self._buffer = np.array([], dtype=np.float32)
        self._buffer_start_ts = None

    def _pull_available_audio(self):
        """Drains whatever's currently queued into the rolling buffer."""
        while True:
            chunk = self.audio_capture.get_chunk(timeout=0.05)
            if chunk is None:
                break
            ts, samples = chunk
            if self._buffer_start_ts is None:
                self._buffer_start_ts = ts
            self._buffer = np.concatenate([self._buffer, samples])

    def poll(self):
        """
        Call this in a loop. Returns a list of newly transcribed
        utterance dicts ({"text", "start", "end"}) whenever enough
        audio has accumulated, otherwise an empty list.
        """
        self._pull_available_audio()

        buffer_duration = len(self._buffer) / cfg.SAMPLE_RATE

        if cfg.DEBUG_AUDIO_LEVEL:
            level = float(np.abs(self._buffer).max()) if len(self._buffer) else 0.0
            print(f"  [debug] buffer={buffer_duration:.1f}s  peak_level={level:.4f}"
                  + ("  <- silence, check mic" if buffer_duration > 1 and level < 0.001 else ""))

        if buffer_duration < cfg.CHUNK_DURATION_SEC:
            return []

        # --- Silence gate ---
        # Whisper models are known to hallucinate short filler phrases
        # ("you", "thank you", "bye") when fed silence or near-silence --
        # a side effect of training data full of YouTube captions ending
        # in exactly those phrases. If this whole chunk is quiet, skip
        # calling the model at all rather than let it invent something.
        peak_level = float(np.abs(self._buffer).max())
        if peak_level < cfg.SILENCE_GATE_THRESHOLD:
            overlap_samples = int(cfg.CHUNK_OVERLAP_SEC * cfg.SAMPLE_RATE)
            discarded_duration = (len(self._buffer) - overlap_samples) / cfg.SAMPLE_RATE
            self._buffer = self._buffer[-overlap_samples:]
            self._buffer_start_ts += discarded_duration
            return []

        # --- Backlog recovery ---
        # If we've fallen behind (buffer grew well past CHUNK_DURATION_SEC
        # because a previous transcribe() call took too long), transcribing
        # the WHOLE backlog just makes the next call even slower, which
        # makes the lag compound instead of recover. Instead, drop the
        # oldest excess audio and only transcribe the most recent window --
        # this trades a few missed words for staying close to real time,
        # which matters more for a live-assist tool than completeness.
        max_backlog_sec = cfg.CHUNK_DURATION_SEC * cfg.MAX_BACKLOG_MULTIPLE
        if buffer_duration > max_backlog_sec:
            keep_samples = int(max_backlog_sec * cfg.SAMPLE_RATE)
            dropped_duration = (len(self._buffer) - keep_samples) / cfg.SAMPLE_RATE
            self._buffer = self._buffer[-keep_samples:]
            self._buffer_start_ts += dropped_duration
            print(f"  [transcription falling behind -- dropped {dropped_duration:.1f}s "
                  f"of backlog to catch back up]")

        # vad_filter=True runs faster-whisper's built-in Silero VAD pass
        # first, so it only actually transcribes segments that contain
        # real speech -- the second, more robust layer against
        # hallucinated filler during silence.
        segments, _ = self.model.transcribe(
            self._buffer, language="en",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )
        results = []
        for seg in segments:
            if seg.text.strip():
                results.append({
                    "text": seg.text.strip(),
                    "start": self._buffer_start_ts + seg.start,
                    "end": self._buffer_start_ts + seg.end,
                })

        # Keep the last CHUNK_OVERLAP_SEC of audio so words spanning
        # the boundary aren't lost, discard the rest, advance the
        # buffer's start timestamp accordingly
        overlap_samples = int(cfg.CHUNK_OVERLAP_SEC * cfg.SAMPLE_RATE)
        discarded_duration = (len(self._buffer) - overlap_samples) / cfg.SAMPLE_RATE
        self._buffer = self._buffer[-overlap_samples:]
        self._buffer_start_ts += discarded_duration

        return results
