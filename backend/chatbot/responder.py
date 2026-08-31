"""
Week 7 - Chatbot response generation.

Turns a classified intent into an answer. Each intent has its own strategy:
some look up lesson content, some query the student's progress from MongoDB,
some are pure templates.

Deliberately rule-based
-----------------------
The action plan specifies a rule-based approach, and for this project it is
also the right call. A generative model would need to be constrained heavily to
avoid inventing facts for school children, and every answer here must trace
back to the Week 2 content bank. Retrieval plus templates means the student
never sees anything that is not in the curriculum.

The NLP does the hard part - understanding what was asked. The response layer
then decides what to do about it.
"""

from __future__ import annotations

import random

from ..nlp.classifier import CONFIDENCE_THRESHOLD

FALLBACK_RESPONSES = [
    "I am not sure I understood that. Could you ask it in a different way?",
    "Sorry, I did not follow. Try rephrasing your question?",
    "I did not quite get that. Can you say it another way?",
]

GREETINGS = [
    "Hello! I am your EduQuest study buddy. Ask me about any chapter, or say 'give me a quiz' to practise.",
    "Hi there! Ready to learn? You can ask me to explain a topic, show an example, or start a quiz.",
    "Namaste! Ask me anything about your lessons, or check your progress by asking 'what is my score'.",
]

OUT_OF_SCOPE = (
    "I can only help with your lessons and quizzes. "
    "Try asking me about a chapter, a formula, or your progress."
)


def _lesson_link(lesson: dict | None) -> dict | None:
    if not lesson:
        return None
    return {
        "id": lesson["id"],
        "title": lesson["title"],
        "subject": lesson["subject"],
        "grade": lesson["grade"],
    }


def _no_lesson_found(topic_word: str = "that topic") -> str:
    return (
        f"I could not find a chapter about {topic_word} for your grade. "
        "Try naming the chapter, or pick a subject from the Lessons page."
    )


class ChatResponder:
    """Builds a reply for a classified query."""

    def __init__(self, retriever=None, database=None) -> None:
        self._retriever = retriever
        self._db = database

    # -- helpers ------------------------------------------------------------
    def _find_lesson(self, query_vector, grade: int | None, query_text: str | None = None):
        if self._retriever is None:
            return None
        return self._retriever.best_match(
            query_vector, grade=grade, query_text=query_text
        )

    def _progress_for(self, user_id: str | None) -> dict | None:
        """Read the student's quiz history straight from MongoDB."""
        if not user_id or self._db is None:
            return None

        attempts = list(
            self._db["quiz_attempts"].find({"user_id": user_id}, {"_id": 0, "score": 1})
        )
        points = 0
        try:
            from bson import ObjectId

            user = self._db["users"].find_one({"_id": ObjectId(user_id)}, {"points": 1})
            points = (user or {}).get("points", 0)
        except Exception:
            points = 0

        scores = [a["score"] for a in attempts]
        return {
            "attempts": len(scores),
            "average": round(sum(scores) / len(scores)) if scores else 0,
            "best": max(scores) if scores else 0,
            "points": points,
        }

    def _quizzes_for(self, grade: int | None) -> list[dict]:
        if self._db is None:
            return []
        query = {"grade": grade} if grade is not None else {}
        return list(
            self._db["quizzes"].find(query, {"_id": 0, "id": 1, "title": 1, "subject": 1}).limit(5)
        )

    # -- intent handlers ----------------------------------------------------
    def _definition(self, lesson):
        if not lesson:
            return _no_lesson_found("that term"), None
        return (
            f"That comes up in \"{lesson['title']}\" ({lesson['subject']}). "
            f"{lesson.get('summary', '')} "
            "Open the chapter for the full explanation."
        ), lesson

    def _concept_explanation(self, lesson):
        if not lesson:
            return _no_lesson_found(), None
        return (
            f"Have a look at \"{lesson['title']}\" in {lesson['subject']}. "
            f"{lesson.get('summary', '')} "
            "The chapter walks through it step by step."
        ), lesson

    def _example_request(self, lesson):
        if not lesson:
            return (
                "Tell me which topic you want an example for and I will point you "
                "to the right chapter."
            ), None
        return (
            f"\"{lesson['title']}\" has worked examples inside the chapter. "
            "You can also try its quiz to practise on real questions."
        ), lesson

    def _formula_help(self, lesson):
        if not lesson:
            return (
                "Which topic is the formula for? Name the chapter or the concept "
                "and I will find it."
            ), None
        return (
            f"The formula you need is explained in \"{lesson['title']}\". "
            "Open the chapter and look for the worked example - it shows each "
            "step with the numbers filled in."
        ), lesson

    def _homework_help(self, lesson):
        base = (
            "I will not give you the answer outright, because working it through "
            "is how it sticks. "
        )
        if not lesson:
            return base + "Tell me which chapter it is from and I will point you to the right notes.", None
        return (
            base
            + f"This looks like it is from \"{lesson['title']}\". Re-read that "
            "chapter's example, then try your problem the same way."
        ), lesson

    def _clarification(self, lesson):
        if not lesson:
            return (
                "Happy to go over it again. Which part was confusing - "
                "the idea itself, or how to use it in a question?"
            ), None
        return (
            f"Let me point you back to \"{lesson['title']}\". "
            f"{lesson.get('summary', '')} "
            "Try reading just the first section again, then ask me about the "
            "specific bit that is unclear."
        ), lesson

    def _quiz_help(self, grade):
        available = self._quizzes_for(grade)
        if not available:
            return "I could not find a quiz for your grade yet. Check the Lessons page.", None
        titles = ", ".join(q["title"] for q in available[:3])
        return (
            f"Here is what you can practise right now: {titles}. "
            "Open the Lessons page and pick one to start."
        ), None

    def _progress_help(self, user_id):
        stats = self._progress_for(user_id)
        if stats is None:
            return "Log in and I can show you your progress.", None
        if stats["attempts"] == 0:
            return (
                "You have not attempted a quiz yet. Finish a chapter and try its "
                "quiz - that is how you start earning XP."
            ), None
        return (
            f"You have completed {stats['attempts']} "
            f"{'quiz' if stats['attempts'] == 1 else 'quizzes'}, "
            f"averaging {stats['average']}%, with a best score of {stats['best']}%. "
            f"You have {stats['points']} XP."
        ), None

    # -- entry point --------------------------------------------------------
    def respond(
        self,
        intent: str,
        confidence: float,
        query_vector=None,
        grade: int | None = None,
        user_id: str | None = None,
        query_text: str | None = None,
    ) -> dict:
        """Build the reply. Returns reply text, the matched lesson, and flags."""
        if confidence < CONFIDENCE_THRESHOLD:
            return {
                "reply": random.choice(FALLBACK_RESPONSES),
                "understood": False,
                "lesson": None,
            }

        if intent == "greeting":
            return {"reply": random.choice(GREETINGS), "understood": True, "lesson": None}

        if intent == "out_of_scope":
            return {"reply": OUT_OF_SCOPE, "understood": True, "lesson": None}

        if intent == "progress_help":
            reply, lesson = self._progress_help(user_id)
            return {"reply": reply, "understood": True, "lesson": _lesson_link(lesson)}

        if intent == "quiz_help":
            reply, lesson = self._quiz_help(grade)
            return {"reply": reply, "understood": True, "lesson": _lesson_link(lesson)}

        # The remaining intents all benefit from finding a relevant chapter.
        lesson = (
            self._find_lesson(query_vector, grade, query_text)
            if query_vector is not None
            else None
        )

        handlers = {
            "definition": self._definition,
            "concept_explanation": self._concept_explanation,
            "example_request": self._example_request,
            "formula_help": self._formula_help,
            "homework_help": self._homework_help,
            "clarification": self._clarification,
        }
        handler = handlers.get(intent)
        if handler is None:
            return {
                "reply": random.choice(FALLBACK_RESPONSES),
                "understood": False,
                "lesson": None,
            }

        reply, matched = handler(lesson)
        return {"reply": reply, "understood": True, "lesson": _lesson_link(matched)}
