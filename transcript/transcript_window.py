"""
A persistent window that renders the running transcript as it comes
in, most recent line at the bottom. Also owns the quit check
(press 'q' or Esc while the window is focused) since it's the window
that's on-screen most of the time.

MUST be driven from the main thread, same reason as video_ondemand.py.
"""

import cv2
import numpy as np

import config_realtime as cfg


class TranscriptWindow:
    def __init__(self):
        self.lines = []  # list of (text, flagged: bool)
        self.width, self.height = cfg.TRANSCRIPT_WINDOW_SIZE
        cv2.namedWindow(cfg.TRANSCRIPT_WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(cfg.TRANSCRIPT_WINDOW_NAME, self.width, self.height)
        self.render()

    def add_line(self, speaker: str, text: str, flagged: bool):
        prefix = "[FLAGGED] " if flagged else ""
        self.lines.append((f"{speaker}: {prefix}{text}", flagged))
        self.lines = self.lines[-cfg.TRANSCRIPT_MAX_LINES:]
        self.render()

    def set_status(self, status: str):
        """Shows a transient status line at the very top (e.g. 'Listening...')."""
        self._status = status
        self.render()

    def render(self):
        canvas = np.full((self.height, self.width, 3), 30, dtype=np.uint8)

        status = getattr(self, "_status", "Listening...")
        cv2.putText(canvas, status, (15, 25), cv2.FONT_HERSHEY_SIMPLEX,
                    0.5, (150, 150, 150), 1, cv2.LINE_AA)
        cv2.line(canvas, (0, 35), (self.width, 35), (70, 70, 70), 1)

        y = 65
        for text, flagged in self.lines:
            color = (100, 180, 255) if flagged else (230, 230, 230)
            # simple manual wrap so long lines don't run off the window
            max_chars = 95
            wrapped = [text[i:i + max_chars] for i in range(0, len(text), max_chars)] or [""]
            for line in wrapped:
                cv2.putText(canvas, line, (15, y), cv2.FONT_HERSHEY_SIMPLEX,
                            0.55, color, 1, cv2.LINE_AA)
                y += 28

        cv2.imshow(cfg.TRANSCRIPT_WINDOW_NAME, canvas)

    def close(self):
        cv2.destroyWindow(cfg.TRANSCRIPT_WINDOW_NAME)
        cv2.waitKey(1)
