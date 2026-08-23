"""
Same interpretation approach as the post-hoc pipeline -- descriptive
first, explicitly tentative interpretation second -- called via a
thread pool from run_realtime.py so it never blocks live capture.
"""

import os
import anthropic
import config_realtime as cfg

INTERPRETATION_PROMPT = """You are assisting a researcher studying nonverbal \
communication in ICU care team rounds, in a live session. Below is a flagged \
utterance, along with several video frames sampled from the moment it was \
spoken.

Speaker: {speaker}
Utterance: "{text}"
Why this was flagged: context-dependency score={score}, deictic density={density}

Describe, in concrete observational terms (not interpretive labels), what is \
visible in these frames: body posture, gaze direction, gesture, spatial \
positioning, and any visible facial expression. Then, separately, offer a \
tentative interpretation of how this visual information might relate to the \
flagged utterance -- clearly marked as tentative, noting what a human should \
verify. Do not assert confident conclusions about intent or emotion. Keep \
your response under 150 words -- this is a live session, so brevity matters."""


def interpret(speaker: str, text: str, score: float, density: float,
              frames_b64: list, api_key: str = None) -> str:
    if not frames_b64:
        return "[No video frames available in buffer for this moment]"

    client = anthropic.Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
    content = [{
        "type": "text",
        "text": INTERPRETATION_PROMPT.format(
            speaker=speaker, text=text, score=score, density=density
        ),
    }]
    for frame in frames_b64:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": frame},
        })

    response = client.messages.create(
        model=cfg.CLAUDE_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text


MANUAL_CODE_INTERPRETATION_PROMPT = """You are assisting a researcher studying \
nonverbal communication in ICU care team rounds, in a live session. A human \
observer directly watched the speaker and logged one or more nonverbal \
behavior codes for the utterance below -- this is the researcher's own direct \
observation, not something inferred from video.

Recent conversation leading up to this moment (oldest first):
{context}

Speaker: {speaker}
Utterance: "{text}"
Nonverbal code(s) the researcher logged: {codes}

If the utterance contains an ambiguous or context-dependent reference (e.g. \
"this," "that," "it," "over here," "the same thing"), use the conversation \
above to make a tentative, best-effort guess at what specific thing is being \
referred to -- clearly flagged as a guess, not a certainty. Then offer a \
tentative interpretation of what this pairing of words and observed \
nonverbal behavior might indicate about the exchange (e.g. genuine agreement \
vs. reluctant deference, engagement vs. distraction, whichever is actually \
relevant here). Clearly mark this as tentative and note what the researcher \
should weigh against their own judgment and the team's relational context, \
which you don't have access to. Do not assert a confident conclusion about \
intent or emotion. Keep your response under 150 words -- this is a live \
session, so brevity matters."""


def interpret_manual_codes(speaker: str, text: str, code_labels: list,
                            context: list = None, api_key: str = None) -> str:
    """
    Text-only interpretation: no camera involved, since the human
    observer already supplied the nonverbal observation directly via
    the codes they logged. This reasons over the utterance + those
    codes together, plus recent conversation context to help resolve
    ambiguous references.

    context: list of {"speaker": ..., "text": ...} dicts, oldest first,
    NOT including the utterance being interpreted itself.
    """
    if not code_labels:
        return "[No codes were logged for this utterance]"

    context = context or []
    if context:
        context_str = "\n".join(f'{c["speaker"]}: "{c["text"]}"' for c in context)
    else:
        context_str = "(none available -- this is at/near the start of the session)"

    client = anthropic.Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
    prompt = MANUAL_CODE_INTERPRETATION_PROMPT.format(
        speaker=speaker, text=text, codes=", ".join(code_labels), context=context_str,
    )
    response = client.messages.create(
        model=cfg.CLAUDE_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
