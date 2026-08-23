"""
Camera is closed by default. capture_on_demand() opens it, shows a
live preview window for CAMERA_CAPTURE_DURATION_SEC while sampling
frames, then closes the camera and the window.

MUST be called from the main thread -- OpenCV's window functions
(imshow/waitKey) require this, especially on macOS.

ACCURACY NOTE (see README): this captures what's happening WHEN
CALLED, not what was happening when the flagged words were actually
spoken a few seconds earlier. That's the tradeoff for not running a
continuous buffer.
"""

import time
import base64
import cv2

import config_realtime as cfg


def capture_on_demand(duration_sec: float = None, n_frames: int = None) -> list:
    """
    Opens the camera, shows a live preview window for duration_sec
    while sampling n_frames evenly across that window, then closes
    everything. Returns a list of base64-encoded JPEG frames.
    """
    duration_sec = duration_sec or cfg.CAMERA_CAPTURE_DURATION_SEC
    n_frames = n_frames or cfg.FRAMES_PER_CLIP

    cap = cv2.VideoCapture(cfg.CAMERA_INDEX)
    if not cap.isOpened():
        print("  [camera] could not open camera -- skipping this check")
        return []

    cv2.namedWindow(cfg.CAMERA_WINDOW_NAME, cv2.WINDOW_NORMAL)

    captured = []
    start = time.time()
    next_sample_at = [start + i * duration_sec / n_frames for i in range(n_frames)]
    sample_idx = 0

    while time.time() - start < duration_sec:
        ok, frame = cap.read()
        if not ok:
            continue

        cv2.imshow(cfg.CAMERA_WINDOW_NAME, frame)
        cv2.waitKey(1)  # required for the window to actually paint/refresh

        now = time.time()
        if sample_idx < n_frames and now >= next_sample_at[sample_idx]:
            ok, buf = cv2.imencode(".jpg", frame)
            if ok:
                captured.append(base64.b64encode(buf).decode("utf-8"))
            sample_idx += 1

    cap.release()
    cv2.destroyWindow(cfg.CAMERA_WINDOW_NAME)
    cv2.waitKey(1)  # let the OS actually close the window before continuing

    return captured
