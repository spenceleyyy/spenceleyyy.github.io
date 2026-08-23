"""
Your nonverbal coding scheme. Each entry is one code you can log with
a single keypress while a session is running.

EDIT THIS to match your actual codebook -- per the "pragmatic guide"
approach discussed earlier, your codes should come from your research
question and be piloted/refined before you trust them, not just
adopted wholesale from a generic list. What's here is a starting
placeholder set spanning a few categories we discussed (gaze,
posture, gesture, adaptors) so the tool runs out of the box.

Rules:
  - "key" must be a single lowercase letter or digit, and must be
    unique across the whole list.
  - Don't reuse: q, m, x (reserved -- quit, mode toggle, dismiss/skip)
"""

CODES = [
    {"key": "g", "label": "Gaze aversion"},
    {"key": "e", "label": "Eye contact / engaged gaze"},
    {"key": "u", "label": "Closed/defensive posture"},
    {"key": "o", "label": "Open posture, facing speaker"},
    {"key": "a", "label": "Adaptor (self-touch, fidgeting)"},
    {"key": "i", "label": "Illustrator gesture (matches speech)"},
    {"key": "n", "label": "Nod / backchannel gesture"},
    {"key": "f", "label": "Flat / neutral facial expression"},
    {"key": "p", "label": "Pointing to person"}
]

# Sanity checks so a typo in the list above fails loudly at startup
# rather than silently misbehaving mid-session.
_reserved = {"q", "m", "x"}
_keys = [c["key"] for c in CODES]
assert len(_keys) == len(set(_keys)), "Duplicate keys in CODES -- each must be unique."
assert all(len(k) == 1 for k in _keys), "Each code key must be a single character."
assert not (set(_keys) & _reserved), f"Codes can't use reserved keys: {_reserved}"
