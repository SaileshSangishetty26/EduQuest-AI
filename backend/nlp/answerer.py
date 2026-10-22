"""
Week 10 - Extractive question answering over the textbook.

Retrieval finds the passages that are about a student's question; this module
reads those passages and picks out the exact words that answer it.

    "What is the SI unit of length?"
        retrieval -> "...The system of units now used is known as the
                      International System of Units or SI units. The SI unit
                      of length is metre. A metre scale is shown..."
        answer    -> "metre"  (in the sentence "The SI unit of length is metre.")

Model
-----
`distilbert-base-cased-distilled-squad`: DistilBERT fine-tuned on SQuAD, a
dataset of 100,000 questions whose answers are spans of a Wikipedia passage.
It keeps the project on one model family (DistilBERT, as in the action plan)
and, because it can only point at words that are already in the passage, it
cannot invent an answer - every answer is a quotation from the NCERT text.

The model always proposes some span, so each answer carries a confidence (the
probability of its start token times that of its end token). Below
ANSWER_THRESHOLD the chatbot shows the passage instead of a guess.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from .config import QA_MODEL_NAME

# Below this the extracted span is not shown as "the answer". Tuned with
# `python -m backend.nlp.test_answers`.
ANSWER_THRESHOLD = 0.30

MAX_ANSWER_TOKENS = 30   # longer spans are almost always wrong
MAX_LENGTH = 384         # question + passage tokens per window
STRIDE = 96              # overlap when a passage needs more than one window

# "Tell me about magnets" and "give me an example" want a passage, not a
# three-word span, so they are not treated as answerable questions.
QUESTION_START = re.compile(
    r"^\s*(what|what's|whats|which|who|whom|whose|when|where|why|how|"
    r"is|are|was|were|does|do|did|can|could|name|define)\b",
    re.IGNORECASE,
)


def is_question(text: str) -> bool:
    """A question that a short span can answer, rather than 'explain X'."""
    return bool(text) and (text.strip().endswith("?") or bool(QUESTION_START.match(text)))


@dataclass
class Answer:
    text: str
    score: float
    sentence: str
    passage: dict          # the retrieved section the answer came from


def sentence_around(context: str, start: int, end: int) -> str:
    """The sentence of `context` that contains characters start..end."""
    left = max(context.rfind(mark, 0, start) for mark in (". ", "? ", "! ", "\n"))
    left = 0 if left < 0 else left + 1
    right_candidates = [context.find(mark, end) for mark in (". ", "? ", "! ", "\n")]
    right_candidates = [r for r in right_candidates if r >= 0]
    right = min(right_candidates) + 1 if right_candidates else len(context)
    return context[left:right].strip()


def _clean_span(text: str) -> str:
    return text.strip().strip(",;:").strip()


class AnswerExtractor:
    def __init__(self, model_name: str = QA_MODEL_NAME, tokenizer=None, model=None) -> None:
        self.model_name = model_name
        self._tokenizer = tokenizer
        self._model = model

    def _load(self):
        if self._model is None:
            from transformers import AutoModelForQuestionAnswering, AutoTokenizer

            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForQuestionAnswering.from_pretrained(self.model_name)
            self._model.eval()
        return self._tokenizer, self._model

    def _best_span(self, question: str, context: str) -> tuple[str, float, int, int]:
        """Best answer span in one passage: (text, score, char_start, char_end)."""
        import torch

        tokenizer, model = self._load()
        encoded = tokenizer(
            question,
            context,
            truncation="only_second",
            max_length=MAX_LENGTH,
            stride=STRIDE,
            return_overflowing_tokens=True,
            return_offsets_mapping=True,
            padding=True,
            return_tensors="pt",
        )
        offsets = encoded.pop("offset_mapping").tolist()
        encoded.pop("overflow_to_sample_mapping", None)
        inputs = {k: v for k, v in encoded.items() if k in ("input_ids", "attention_mask")}

        with torch.no_grad():
            output = model(**inputs)
        starts = output.start_logits.numpy()
        ends = output.end_logits.numpy()

        best = ("", 0.0, 0, 0)
        for window in range(starts.shape[0]):
            sequence_ids = encoded.sequence_ids(window)
            in_context = np.array([sid == 1 for sid in sequence_ids])
            if not in_context.any():
                continue

            # Softmax over passage tokens only, as the Hugging Face pipeline does.
            start_logits = np.where(in_context, starts[window], -1e9)
            end_logits = np.where(in_context, ends[window], -1e9)
            start_p = np.exp(start_logits - start_logits.max())
            start_p /= start_p.sum()
            end_p = np.exp(end_logits - end_logits.max())
            end_p /= end_p.sum()

            # Every (start, end) pair with start <= end < start + MAX_ANSWER_TOKENS.
            pair = np.triu(np.outer(start_p, end_p))
            pair = np.tril(pair, MAX_ANSWER_TOKENS - 1)
            s, e = np.unravel_index(int(np.argmax(pair)), pair.shape)
            score = float(pair[s, e])
            if score > best[1]:
                char_start = offsets[window][s][0]
                char_end = offsets[window][e][1]
                best = (_clean_span(context[char_start:char_end]), score, char_start, char_end)
        return best

    def best_answer(self, question: str, passages: list[dict]) -> Answer | None:
        """Highest-scoring span across the passages, however low its score."""
        best: Answer | None = None
        for passage in passages:
            context = (passage.get("text") or "").strip()
            if len(context.split()) < 5:
                continue
            text, score, start, end = self._best_span(question, context)
            if not text:
                continue
            if best is None or score > best.score:
                best = Answer(
                    text=text,
                    score=round(score, 4),
                    sentence=sentence_around(context, start, end),
                    passage=passage,
                )
        return best

    def answer(self, question: str, passages: list[dict], threshold: float = ANSWER_THRESHOLD) -> Answer | None:
        """Best answer across the retrieved passages, or None if none is good enough."""
        best = self.best_answer(question, passages)
        if best is None or best.score < threshold:
            return None
        return best


@lru_cache(maxsize=1)
def get_answer_extractor() -> AnswerExtractor:
    return AnswerExtractor()
