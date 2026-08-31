"""
Week 7 - Build the semantic lesson index.

Embeds every lesson's title and summary with the same DistilBERT model used for
student queries, so the two live in the same vector space and can be compared
directly.

Run from the project root:
    python -m backend.nlp.build_lesson_index
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import numpy as np

from .config import PROCESSED_DIR, RETRIEVAL_MODEL_NAME
from .pipeline import NLPPipeline
from .retriever import (
    LESSONS_FILE,
    LESSON_INDEX_FILE,
    LESSON_META_FILE,
    lesson_index_text,
)


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    with open(LESSONS_FILE, encoding="utf-8") as fh:
        lessons = json.load(fh)

    print(f"Loaded {len(lessons)} lessons")

    texts = [lesson_index_text(lesson) for lesson in lessons]

    pipeline = NLPPipeline()
    print(f"Embedding with {RETRIEVAL_MODEL_NAME} ...")
    vectors = pipeline.embed_for_retrieval(texts)

    np.save(LESSON_INDEX_FILE, vectors)

    meta = {
        "model": RETRIEVAL_MODEL_NAME,
        "num_lessons": len(lessons),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "lessons": [
            {
                "id": lesson["id"],
                "title": lesson["title"],
                "subject": lesson["subject"],
                "grade": lesson["grade"],
                "language": lesson.get("language", "en"),
                "summary": lesson.get("summary", ""),
                "indexed_text": text,
            }
            for lesson, text in zip(lessons, texts)
        ],
    }
    with open(LESSON_META_FILE, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2, ensure_ascii=False)

    print(f"  wrote {LESSON_INDEX_FILE.name}  {tuple(vectors.shape)}")
    print(f"  wrote {LESSON_META_FILE.name}")
    print("\nDone. The chatbot can now find lessons by meaning.")


if __name__ == "__main__":
    main()
