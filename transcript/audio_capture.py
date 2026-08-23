"""
Captures live microphone audio in short blocking chunks (sd.rec(),
same call test_mic.py uses successfully), rather than the continuous
InputStream + callback API.

WHY THE CHANGE: on at least one machine we've tested on, the
InputStream/callback approach only received real audio right at the
moment Mic Mode got toggled, then went silent again -- while sd.rec()
worked reliably the whole time. That points at something specific to
the continuous callback stream on that setup, not a general system
problem, so we're using the method that's actually proven to work.

TRADEOFF: repeatedly opening/closing short blocking recordings has
slightly more overhead than one continuous stream, which can produce
tiny gaps between blocks (a few milliseconds) that a continuous
stream wouldn't have. In practice this is unlikely to matter for
flagging purposes, but it's a real difference worth knowing about if
you notice words getting cut at block boundaries.
"""

import time
import queue
import threading

import sounddevice as sd

import config_realtime as cfg

BLOCK_DURATION_SEC = 0.5  # size of each blocking sd.rec() call


class AudioCapture:
    def __init__(self, session_start: float):
        self.session_start = session_start
        self.chunk_queue = queue.Queue()
        self._stop_event = threading.Event()
        self._thread = None

    def _capture_loop(self):
        while not self._stop_event.is_set():
            timestamp = time.time() - self.session_start
            recording = sd.rec(
                int(BLOCK_DURATION_SEC * cfg.SAMPLE_RATE),
                samplerate=cfg.SAMPLE_RATE,
                channels=1,
                dtype="float32",
            )
            sd.wait()
            self.chunk_queue.put((timestamp, recording[:, 0].copy()))

    def start(self):
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=2)

    def get_chunk(self, timeout=1.0):
        """Returns (timestamp, np.array) or None if nothing available."""
        try:
            return self.chunk_queue.get(timeout=timeout)
        except queue.Empty:
            return None
