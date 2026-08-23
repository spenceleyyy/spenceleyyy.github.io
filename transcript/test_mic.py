"""
Standalone mic test -- no whisper, no camera, just: can this machine
actually capture audio through sounddevice right now?

Run this FIRST when transcription seems stuck. It isolates whether
the problem is mic access/permissions (fixable in System Settings)
vs. something in the transcription pipeline itself.
"""

import sounddevice as sd
import numpy as np

DURATION_SEC = 4
SAMPLE_RATE = 16000

print("Available audio input devices:")
print(sd.query_devices())
print(f"\nDefault input device: {sd.query_devices(kind='input')['name']}")

print(f"\nRecording {DURATION_SEC} seconds... talk into your mic now.")
recording = sd.rec(int(DURATION_SEC * SAMPLE_RATE), samplerate=SAMPLE_RATE,
                    channels=1, dtype="float32")
sd.wait()

max_amplitude = np.abs(recording).max()
rms = np.sqrt(np.mean(recording ** 2))

print(f"\nMax amplitude: {max_amplitude:.4f}   RMS: {rms:.4f}")

if max_amplitude < 0.001:
    print("\n*** SILENCE DETECTED ***")
    print("This almost always means one of:")
    print("  1. Your terminal app doesn't have microphone permission")
    print("     -> System Settings > Privacy & Security > Microphone")
    print("        -> make sure Terminal (or iTerm/whatever you're using) is checked")
    print("  2. The wrong input device is selected (see device list above --")
    print("     if your Mac's built-in mic isn't the default, that's likely it)")
else:
    print("\nMic is capturing real audio -- the problem is downstream of this,")
    print("not a permissions/device issue. Let's look at the transcription step next.")
