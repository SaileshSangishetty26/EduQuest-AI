"""
The complete chatbot pipeline, in one place.

The chat endpoint, the sample-output script and the answer test all call
`ChatService.reply`, so what is demonstrated and measured is exactly what
students get. (Before this, the endpoint and the demo script each had their own
copy of the steps, and they had drifted: the live endpoint never searched the
textbook when the intent classifier was unsure, so the "I am not certain, but
this looks relevant" fallback only ever worked in the demo.)

Order of the steps:

  1. Telugu script        -> Telugu chapter matcher        (backend/nlp/telugu.py)
  2. A calculation        -> maths solver with working     (backend/nlp/math_solver.py)
  3. Everything else      -> Week 6 preprocessing, Week 7 intent classifier,
                             semantic retrieval, then
  4. A factual question   -> exact answer extracted from the retrieved
                             textbook passages             (backend/nlp/answerer.py)
  5. Otherwise            -> the Week 7/8 rule-based reply for the intent
"""

from __future__ import annotations

from ..nlp.answerer import get_answer_extractor, is_question
from ..nlp.classifier import CONFIDENCE_THRESHOLD, get_classifier
from ..nlp.math_solver import solve as solve_math
from ..nlp.pipeline import get_pipeline
from ..nlp.retriever import RELEVANCE_THRESHOLD, get_retriever
from ..nlp.telugu import get_telugu_answerer, is_telugu
from .responder import ChatResponder, _lesson_link, answer_reply, math_reply

# Intents whose reply depends on finding a chapter.
CONTENT_INTENTS = {
    "definition",
    "concept_explanation",
    "example_request",
    "formula_help",
    "homework_help",
    "clarification",
}

# Intents where a short exact answer is the right reply. Homework is left out
# on purpose: for homework the bot points to the method, not the answer.
ANSWER_INTENTS = CONTENT_INTENTS - {"homework_help"}

PASSAGES_TO_READ = 3


class ChatService:
    def __init__(self, database=None) -> None:
        self.db = database

    def _lesson(self, lesson_id: str) -> dict | None:
        if self.db is None:
            return None
        return self.db["lessons"].find_one(
            {"id": lesson_id}, {"_id": 0, "id": 1, "title": 1, "subject": 1, "grade": 1}
        )

    def reply(self, message: str, grade: int | None = None, user_id: str | None = None) -> dict:
        # 1. Telugu
        if is_telugu(message):
            result = get_telugu_answerer().reply(message)
            return {**result, "top_intents": [], "cleaned": message, "processed": message}

        # 2. Calculations
        solution = solve_math(message)
        if solution is not None:
            lesson = self._lesson(solution.lesson_id)
            return {
                "reply": math_reply(solution, lesson),
                "intent": "calculation",
                "confidence": 1.0,
                "understood": True,
                "lesson": _lesson_link(lesson),
                "answer": {"text": solution.answer, "sentence": None, "score": 1.0,
                           "source": "math", "working": solution.working},
                "top_intents": [],
                "cleaned": message,
                "processed": message,
            }

        # 3. Intent and retrieval
        pipeline = get_pipeline()
        classifier = get_classifier()
        processed = pipeline.preprocess(message)
        source = processed.normalized_text or message

        intent_vector = pipeline.embedder.encode_one(source)
        intent, confidence = classifier.predict(intent_vector)
        top_intents = classifier.predict_top_k(intent_vector, k=3)
        confident = confidence >= CONFIDENCE_THRESHOLD

        try:
            retriever = get_retriever()
        except FileNotFoundError:
            retriever = None

        # Search the textbook for content intents, and also whenever the
        # classifier is unsure - an oddly phrased question may still be about
        # a chapter.
        needs_retrieval = (confident and intent in CONTENT_INTENTS) or not confident
        retrieval_vector = (
            pipeline.retrieval_embedder.encode_one(source)
            if retriever is not None and needs_retrieval
            else None
        )

        base = {
            "intent": intent,
            "confidence": confidence,
            "top_intents": top_intents,
            "cleaned": source,
            "processed": processed.processed_text,
        }

        # 4. Exact answer from the textbook
        wants_answer = (not confident or intent in ANSWER_INTENTS) and is_question(message)
        if retrieval_vector is not None and wants_answer:
            passages = [
                p for p in retriever.search(
                    retrieval_vector, grade=grade, top_k=PASSAGES_TO_READ, query_text=message
                )
                if p["score"] >= RELEVANCE_THRESHOLD
            ]
            answer = None
            if passages:
                try:
                    answer = get_answer_extractor().answer(message, passages)
                except Exception:
                    # The answer model is optional: if it is missing or fails
                    # to load, fall back to the passage reply below.
                    answer = None
            if answer is not None:
                return {
                    **base,
                    "reply": answer_reply(answer),
                    "understood": True,
                    "lesson": _lesson_link(answer.passage),
                    "answer": {"text": answer.text, "sentence": answer.sentence,
                               "score": answer.score, "source": "textbook"},
                }

        # 5. Rule-based reply for the intent
        result = ChatResponder(retriever=retriever, database=self.db).respond(
            intent=intent,
            confidence=confidence,
            query_vector=retrieval_vector,
            grade=grade,
            user_id=user_id,
            query_text=message,
        )
        return {**base, **result, "answer": None}
