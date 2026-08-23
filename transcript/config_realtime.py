"""
Config for the LIVE / real-time pipeline. Separate from the post-hoc
config since the constraints are different (streaming ASR needs a
smaller/faster model, live video needs a bounded rolling buffer, etc).
"""

# --- Audio capture ---
SAMPLE_RATE = 16000
CHUNK_DURATION_SEC = 3.0     # how much audio we batch before transcribing --
                              # shorter feels more "live" but means more
                              # frequent (smaller) transcription calls
CHUNK_OVERLAP_SEC = 0.5      # overlap between chunks so words at the
                              # boundary don't get cut off / duplicated

# --- Transcription ---
# Accuracy vs. speed tradeoff, roughly: tiny < base < small < medium < large.
# "small" is a reasonable default now that MAX_BACKLOG_MULTIPLE below
# exists as a safety net -- if it falls behind, it recovers instead of
# spiraling into ever-growing lag. Watch the console for
# "[transcription falling behind...]" messages: occasional = fine,
# frequent/constant = drop back down to "base" or "tiny".
WHISPER_MODEL_SIZE = "small"
WHISPER_COMPUTE_TYPE = "int8"   # fastest on CPU; use "float16" if on GPU

# If a chunk takes longer than this multiple of CHUNK_DURATION_SEC to
# process, the transcriber will drop old backlog audio rather than
# let lag keep growing -- trading some missed words for staying
# close to real time. Lower = more aggressive about staying current.
MAX_BACKLOG_MULTIPLE = 2.0

# Below this peak audio level, a chunk is treated as silence and never
# even gets sent to the model -- prevents Whisper's well-known habit
# of hallucinating "you"/"thank you"/etc. on silence. Based on the
# peak_level readings you were seeing (~0.02 during actual silence),
# tune this up or down if real speech gets gated out incorrectly, or
# if hallucinations still slip through.
SILENCE_GATE_THRESHOLD = 0.03

# --- Code-to-utterance matching ---
# Since transcription lags behind real speech, a code you press "as
# you speak" almost never has its matching utterance available yet.
# Instead of matching live, we log the code's real timestamp
# immediately, then match it retroactively once the (delayed)
# utterance covering that moment finally arrives.
#
# Padding around an utterance's [start, end] window when checking
# whether a code's timestamp falls "during" it -- accounts for the
# fact that a keypress won't line up with start/end down to the
# millisecond.
CODE_MATCH_PADDING_SEC = 1.5

# If a logged code hasn't matched any utterance within this long,
# stop waiting and log it as freeform instead (prevents an endless
# growing pool if you code something during a long silence, or speech
# that never got transcribed for some reason).
CODE_MATCH_MAX_WAIT_SEC = 12.0

# How many previous utterances to include as context when asking the
# LLM to interpret a code -- helps it guess what an ambiguous "this"
# or "that" might actually refer to.
CONTEXT_WINDOW_UTTERANCES = 4

# --- Video ---
# Camera is OFF by default and only opens when an utterance is
# flagged -- no continuous recording, no rolling buffer. Tradeoff:
# it captures what's happening WHEN THE FLAG FIRES, which is a few
# seconds after the words were actually spoken (transcription lags
# by roughly CHUNK_DURATION_SEC). See README for why.
CAMERA_INDEX = 0                    # 0 = default webcam
CAMERA_CAPTURE_DURATION_SEC = 3.0   # how long to keep the camera open
                                     # once triggered
FRAMES_PER_CLIP = 4                 # frames sampled from that capture
                                     # window and sent to the LLM

# --- Flagging lexicons (same as the post-hoc pipeline) ---
DEICTIC_TERMS = {
    "this", "that", "these", "those", "here", "there",
    "it", "him", "her", "them", "such",
}
HEDGE_TERMS = {"kind", "sort", "maybe", "probably", "guess", "like"}
VAGUE_BIGRAMS = {
    "kind of", "sort of", "a little", "a bit",
    "over there", "like that", "you know", "i mean",
}
MIN_SCORE = 2
SHORT_UTTERANCE_MAX_WORDS = 8
HIGH_DEICTIC_DENSITY = 0.15

# --- LLM interpretation ---
CLAUDE_MODEL = "claude-sonnet-4-6"
MAX_CONCURRENT_INTERPRETATIONS = 3   # thread pool size for async LLM calls

# --- Debugging ---
# Prints buffer size + peak audio level on every poll -- turn off
# once you've confirmed audio is flowing correctly, it's noisy.
DEBUG_AUDIO_LEVEL = True

# --- Speaker ---
# Single-speaker mode: no diarization, no tagging, just you.
SPEAKER_NAME = "You"

# --- Transcript window ---
TRANSCRIPT_WINDOW_NAME = "Live Transcript"
TRANSCRIPT_MAX_LINES = 15
TRANSCRIPT_WINDOW_SIZE = (900, 500)  # width, height in pixels
CAMERA_WINDOW_NAME = "Camera (checking nonverbal cues...)"

# --- Coding window ---
CODING_WINDOW_NAME = "Nonverbal Coding"
CODING_WINDOW_SIZE = (650, 820)

# --- Mode ---
# "auto"   = on a flag, open camera + get an LLM interpretation (old behavior)
# "manual" = on a flag, prompt YOU to log a code from codebook.py instead
# Press 'm' during a session to toggle between them at any time.
DEFAULT_MODE = "manual"
