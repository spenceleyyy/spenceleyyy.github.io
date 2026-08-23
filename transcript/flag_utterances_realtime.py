"""
Same lexicon-flagging logic as the post-hoc pipeline's
flag_utterances.py, kept as a self-contained copy here so the
realtime/ folder can run independently.
"""

import re
import config_realtime as cfg


def _tokenize(text: str):
    return re.findall(r"[a-z']+", text.lower())


def _bigrams(text: str):
    words = _tokenize(text)
    return [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]


def score_utterance(text: str) -> dict:
    words = _tokenize(text)
    bigrams = _bigrams(text)
    n_words = len(words)

    n_deictic = sum(w in cfg.DEICTIC_TERMS for w in words)
    n_hedge = sum(w in cfg.HEDGE_TERMS for w in words)
    n_vague_bigram = sum(b in cfg.VAGUE_BIGRAMS for b in bigrams)

    deictic_density = n_deictic / n_words if n_words else 0
    score = n_deictic + n_hedge + n_vague_bigram

    flagged = (
        score >= cfg.MIN_SCORE
        or (deictic_density > cfg.HIGH_DEICTIC_DENSITY
            and n_words <= cfg.SHORT_UTTERANCE_MAX_WORDS)
    )

    return {
        "n_words": n_words,
        "context_dependency_score": score,
        "deictic_density": round(deictic_density, 3),
        "flagged": flagged,
    }
