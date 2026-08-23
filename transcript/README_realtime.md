# Real-Time Pipeline: Transcript + Retroactive Code Matching + Camera Fallback

Mic runs continuously and transcribes in near-real-time. **Coding is
always active** -- press a code key any time, including while you're
mid-sentence. Auto-mode (camera + LLM on a flagged utterance) is
separately toggleable with `'m'` and doesn't affect coding at all.

## Why matching is retroactive, not live

Transcription lags 3-5 seconds behind real speech. If you press a
code key for what you're saying *right now*, the utterance covering
that exact moment hasn't been transcribed yet -- there's nothing to
attach the code to live. Earlier versions of this tool tried to match
codes to a "currently pending" utterance and it just attached codes to
the wrong (or no) utterance most of the time, because "currently
pending" was always a few seconds stale.

The fix: every code press is logged immediately with its real
timestamp and sits in a "matching..." state. When the (delayed)
utterance covering that moment finally arrives from the transcriber,
its `[start, end]` window (+ a small padding buffer,
`CODE_MATCH_PADDING_SEC` in config) gets checked against every
still-waiting code. Anything that falls inside gets retroactively
attached -- this is what actually keeps codes and speech in sync,
instead of a live match that can't work given the inherent delay. If
a code never finds a match within `CODE_MATCH_MAX_WAIT_SEC`, it gets
logged standalone instead of waiting forever.

## Setup

```bash
pip install -r requirements_realtime.txt
```

Set `ANTHROPIC_API_KEY` (used for both auto-mode interpretations and
manual-code interpretations).

## Running it

```bash
python run_realtime.py
```

Talk normally, and press a code key whenever you observe something --
during the utterance, right after, whenever. The coding window shows
each code's status live:

- `[12.3s] Pointing to person -- matching...` -- waiting for the
  transcript to catch up
- `[12.3s] Pointing to person -- matched: "We need to look at this"`
  -- found its utterance, and an interpretation request just fired
- `[12.3s] Pointing to person -- no utterance found (timed out)` --
  gave up waiting, logged standalone instead

Press **'x'** to immediately flush all currently-waiting codes as
standalone (skip the timeout wait). Press **'m'** to toggle whether a
flagged utterance also opens the camera for an auto-interpretation --
independent of coding, which is always running. **'q'**/Esc to stop.

## Context-aware interpretation

Interpretation now includes the last few utterances leading up to the
coded one (`CONTEXT_WINDOW_UTTERANCES` in config, default 4), so
Claude has something to reason from when your utterance contains an
ambiguous reference -- "this document," "over here," "the same
thing." It's asked to make a tentative, clearly-flagged guess at what
the reference points to using that context, not just describe the
isolated sentence. This is still text-only reasoning over what you
said and what you observed, not image analysis -- no camera involved
in manual mode.

## Tuning the sync if it's still off

- **Codes matching the wrong utterance, or nothing at all:** increase
  `CODE_MATCH_PADDING_SEC` (default 1.5s) if your reaction timing
  tends to land right at an utterance's edge.
- **Codes waiting too long before giving up:** lower
  `CODE_MATCH_MAX_WAIT_SEC` (default 12s) if you'd rather they go
  standalone sooner. Raise it if your transcription is running
  especially far behind real time and matches are timing out before
  they'd otherwise land correctly.
- **Transcription lag itself:** still governed by `CHUNK_DURATION_SEC`
  and `WHISPER_MODEL_SIZE`, discussed earlier -- the matching system
  tolerates lag rather than eliminating it, so if lag is severe,
  address that directly too.

## What's still true from before

- **On-demand camera (auto mode) still only sees "now," not the exact
  spoken moment.** Manual coding sidesteps this, since you supply the
  observation directly.
- **This is a live-assist/piloting tool, not your validated research
  pipeline.** Same inter-rater reliability logic applies: pilot this,
  check whether codes are landing where you'd expect, validate before
  trusting a full session's data.

## Files

- `config_realtime.py` -- all settings, including the new matching/context tunables
- `codebook.py` -- your coding scheme, edit this
- `coding_window.py` -- shows live code-matching status + interpretations
- `transcript_window.py` -- the live transcript display
- `audio_capture.py`, `streaming_transcribe.py` -- mic + near-real-time transcription
- `flag_utterances_realtime.py` -- lexicon-based flagging logic (auto-mode trigger only)
- `video_ondemand.py`, `interpret_realtime.py` -- auto-mode camera+LLM path, and manual-code interpretation
- `run_realtime.py` -- the main loop, run this one
- `test_mic.py` -- standalone mic diagnostic
