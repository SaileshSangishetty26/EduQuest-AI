"""
Week 7 - Semantic lesson retrieval.

Finds the lesson most relevant to a student's question by comparing DistilBERT
embeddings, rather than matching keywords.

Why semantic rather than keyword search
---------------------------------------
"Explain how plants make food" shares no useful keyword with a chapter titled
"Photosynthesis", so a keyword search returns nothing. Embedding both and
comparing them by cosine similarity finds it, because the two phrases sit close
together in the embedding space. This is the same pipeline Week 6 built, reused
on the content side.

The index is built once from data/lessons.json and cached to disk, so the
16 lessons are only embedded a single time rather than on every request.
"""

from __future__ import annotations

import json
from functools import lru_cache

import numpy as np

from .config import DATA_DIR, PROCESSED_DIR

# Words stripped before lexical matching. The Week 6 preprocessing keeps
# question words on purpose - they carry intent - but here they are pure noise:
# without this filter "what is an acid" matches any chapter whose summary opens
# with "What if ...".
_LEXICAL_STOPWORDS = frozenset("""
what when where which whose whom that this these those there here
does did done doing have has had will would could should shall
about with from into onto over under between among during
explain tell show give help please make made take took
some more most much many other another such very just only
your yours mine ours their them they then than
""".split())

LESSON_INDEX_FILE = PROCESSED_DIR / "lesson_embeddings.npy"
LESSON_META_FILE = PROCESSED_DIR / "lesson_index_meta.json"
LESSONS_FILE = DATA_DIR / "lessons.json"

# Below this similarity, treat the best match as "nothing relevant found".
#
# This value depends entirely on which embedding model is configured.
#
# With the base `distilbert-base-uncased` checkpoint, unrelated text sat at
# ~0.70 similarity and nothing below 0.78 was meaningful. The retrieval-tuned
# checkpoint spreads scores out properly, so the useful cutoff is much lower.
#
# Always re-tune after changing EMBEDDING_MODEL_NAME:
#     python -m backend.nlp.test_retrieval
RELEVANCE_THRESHOLD = 0.35


def lesson_index_text(lesson: dict) -> str:
    """
    The text used to represent a lesson in the index.

    Title plus summary, not the full chapter body: the body is long enough that
    it would be truncated at 64 tokens anyway, and its opening lines are often
    scene-setting rather than topical. Title and summary describe what the
    chapter is actually about.
    """
    return (
        f"{lesson['subject']}. {lesson['title']}. {lesson.get('summary', '')}"
    ).strip()


class LessonRetriever:
    """Cosine-similarity search over the lesson index."""

    def __init__(self) -> None:
        if not LESSON_INDEX_FILE.exists() or not LESSON_META_FILE.exists():
            raise FileNotFoundError(
                "Lesson index not found. Build it with:\n"
                "    python -m backend.nlp.build_lesson_index"
            )

        self.vectors = np.load(LESSON_INDEX_FILE)
        with open(LESSON_META_FILE, encoding="utf-8") as fh:
            self.meta = json.load(fh)
        self.lessons = self.meta["lessons"]

    @staticmethod
    def _lexical_overlap(query_text: str, lesson: dict) -> float:
        """
        Fraction of the query's words that appear in the lesson's indexed text.

        Semantic search alone misses obvious word matches: "what is an acid"
        should find a chapter with "Acidic" in the title, but the embeddings
        ranked it second. Prefix matching catches acid/acidic, angle/angles and
        pattern/patterns, which are exactly the cases students actually type.
        """
        query_words = {
            w.strip(".,:;!?\"'()").lower()
            for w in query_text.split()
        }
        query_words = {
            w for w in query_words if len(w) > 3 and w not in _LEXICAL_STOPWORDS
        }
        if not query_words:
            return 0.0

        lesson_words = {
            w.strip(".,:;!?\"'()").lower()
            for w in lesson.get("indexed_text", lesson.get("title", "")).split()
        }
        lesson_words = {
            w for w in lesson_words if len(w) > 3 and w not in _LEXICAL_STOPWORDS
        }

        hits = 0
        for qw in query_words:
            for lw in lesson_words:
                if (
                    qw == lw
                    or (len(lw) >= 4 and qw.startswith(lw[:4]))
                    or (len(qw) >= 4 and lw.startswith(qw[:4]))
                ):
                    hits += 1
                    break
        return hits / len(query_words)

    def search(
        self,
        query_vector: np.ndarray,
        grade: int | None = None,
        subject: str | None = None,
        top_k: int = 3,
        query_text: str | None = None,
        lexical_weight: float = 0.25,
    ) -> list[dict]:
        """
        Return the top_k most similar lessons, each with a `score`.

        Grade and subject filters are applied before ranking so a Grade 6
        student never gets pointed at a Grade 7 chapter.
        """
        candidates = [
            i
            for i, lesson in enumerate(self.lessons)
            if (grade is None or lesson["grade"] == grade)
            and (subject is None or lesson["subject"] == subject)
        ]
        if not candidates:
            return []

        query = query_vector / max(float(np.linalg.norm(query_vector)), 1e-9)
        subset = self.vectors[candidates]
        semantic = subset @ query

        # Blend in lexical overlap when the raw query text is available.
        if query_text:
            lexical = np.array(
                [
                    self._lexical_overlap(query_text, self.lessons[i])
                    for i in candidates
                ]
            )
            scores = (1 - lexical_weight) * semantic + lexical_weight * lexical
        else:
            lexical = np.zeros(len(candidates))
            scores = semantic

        order = np.argsort(scores)[::-1][:top_k]
        results = []
        for position in order:
            index = int(position)
            lesson = dict(self.lessons[candidates[index]])
            lesson["score"] = round(float(scores[index]), 4)
            lesson["semantic_score"] = round(float(semantic[index]), 4)
            lesson["lexical_score"] = round(float(lexical[index]), 4)
            results.append(lesson)
        return results

    def best_match(
        self,
        query_vector: np.ndarray,
        grade: int | None = None,
        query_text: str | None = None,
    ) -> dict | None:
        """Single best lesson, or None if nothing clears the relevance bar."""
        results = self.search(
            query_vector, grade=grade, top_k=1, query_text=query_text
        )
        if not results:
            return None
        return results[0] if results[0]["score"] >= RELEVANCE_THRESHOLD else None


@lru_cache(maxsize=1)
def get_retriever() -> LessonRetriever:
    return LessonRetriever()
