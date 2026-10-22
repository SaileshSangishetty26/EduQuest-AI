"""
Produce a report of sample questions and the system's answers.

Runs a set of questions through the complete pipeline - preprocessing, intent
classification, chapter retrieval and response generation - and writes a
readable report. Intended for demonstrations and progress reviews, where a
printed set of real inputs and outputs is more convincing than a description.

Run from the project root:

    python -m backend.nlp.demo_samples
    python -m backend.nlp.demo_samples --ask "what is a fraction"

The report is written to data/processed/sample_outputs.md as well as printed.
"""

from __future__ import annotations

import argparse
from datetime import datetime

from .classifier import CONFIDENCE_THRESHOLD, get_classifier
from .config import PROCESSED_DIR
from .pipeline import get_pipeline

REPORT_FILE = PROCESSED_DIR / "sample_outputs.md"

# Grouped so the report shows the system handling distinct kinds of question,
# not just many variations of one.
SAMPLE_GROUPS = [
    (
        "Questions about a topic",
        "Answered by finding the passage in the chapter that addresses them.",
        [
            "what is a prime number",
            "how do camels survive in the desert",
            "explain lines and angles",
            "what is symmetry",
            "give me an example of a number pattern",
        ],
    ),
    (
        "Questions where the wording does not match the chapter",
        "No shared keyword with the chapter title, so these test understanding "
        "of meaning rather than word matching.",
        [
            "how do plants and animals suit where they live",
            "what did Rama Natha learn about wealth",
            "the story about the elephant and the dog",
        ],
    ),
    (
        "Questions about the catalogue",
        "Answered from the content bank directly; there is nothing to search "
        "for, because the student is asking what exists.",
        [
            "list the chapters",
            "show me the science chapters",
            "what subjects can I study",
        ],
    ),
    (
        "Questions the system should decline",
        "Outside the curriculum, or about data the app does not record.",
        [
            "book me a hotel",
            "who won the cricket match",
            "how much time did I spend studying",
        ],
    ),
    (
        "Badly phrased questions",
        "The classifier is unsure, but a relevant chapter is still found and "
        "shown with an honest caveat.",
        [
            "angle thing confusing help",
            "prime number what mean",
            "asdfgh qwerty",
        ],
    ),
]

CONTENT_INTENTS = {
    "definition",
    "concept_explanation",
    "example_request",
    "formula_help",
    "homework_help",
    "clarification",
}


def answer(question: str, grade: int | None, responder, pipeline, classifier, retriever):
    """Run one question through the full pipeline and collect what happened."""
    processed = pipeline.preprocess(question)
    source = processed.normalized_text or question

    intent_vector = pipeline.embedder.encode_one(source)
    intent, confidence = classifier.predict(intent_vector)
    top_intents = classifier.predict_top_k(intent_vector, k=3)

    confident = confidence >= CONFIDENCE_THRESHOLD
    needs_retrieval = (confident and intent in CONTENT_INTENTS) or not confident

    retrieval_vector = (
        pipeline.retrieval_embedder.encode_one(source)
        if retriever is not None and needs_retrieval
        else None
    )

    result = responder.respond(
        intent=intent,
        confidence=confidence,
        query_vector=retrieval_vector,
        grade=grade,
        user_id=None,
        query_text=question,
    )

    return {
        "question": question,
        "cleaned": source,
        "processed": processed.processed_text,
        "intent": intent,
        "confidence": confidence,
        "confident": confident,
        "top_intents": top_intents,
        "understood": result["understood"],
        "lesson": result["lesson"],
        "reply": result["reply"],
    }


def render(entry: dict) -> str:
    """One question and answer, as markdown."""
    lines = [f"### \u201c{entry['question']}\u201d", ""]

    verdict = entry["intent"] if entry["confident"] else f"{entry['intent']} (below threshold)"
    lines.append(f"**Detected as:** {verdict} &mdash; {entry['confidence'] * 100:.1f}% confident")

    if entry["lesson"]:
        lesson = entry["lesson"]
        lines.append(
            f"**Chapter found:** {lesson['title']} "
            f"({lesson['subject']}, Grade {lesson['grade']})"
        )
    else:
        lines.append("**Chapter found:** none")

    # Blockquote line by line; a blank line inside a quote is ">" on its own,
    # and doing this with chained replaces double-prefixes the second line.
    quoted = "\n".join(
        ("> " + line) if line.strip() else ">"
        for line in entry["reply"].split("\n")
    )
    lines += ["", "**Reply:**", "", quoted, ""]

    runners_up = ", ".join(
        f"{name} {prob * 100:.0f}%" for name, prob in entry["top_intents"][1:]
    )
    lines.append(f"*Cleaned to:* `{entry['cleaned']}`  ")
    lines.append(f"*Next closest categories:* {runners_up}")
    lines.append("")
    return "\n".join(lines)


def print_entry(entry: dict) -> None:
    """One question and answer, for the terminal."""
    print(f"\n  Q: {entry['question']}")
    state = "" if entry["confident"] else "  [below confidence threshold]"
    print(f"     intent    : {entry['intent']} ({entry['confidence'] * 100:.1f}%){state}")
    if entry["lesson"]:
        print(f"     chapter   : {entry['lesson']['title']} ({entry['lesson']['subject']})")
    else:
        print("     chapter   : none")
    reply = entry["reply"].replace("\n\n", " ").replace("\n", " ")
    if len(reply) > 240:
        reply = reply[:240].rsplit(" ", 1)[0] + "..."
    print(f"     reply     : {reply}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sample outputs for a demonstration")
    parser.add_argument("--grade", type=int, default=6, help="student grade to answer as")
    parser.add_argument("--ask", metavar="QUESTION", help="run one question instead")
    args = parser.parse_args()

    pipeline = get_pipeline()

    try:
        classifier = get_classifier()
    except FileNotFoundError:
        raise SystemExit(
            "The classifier has not been trained. Run:\n"
            "    python -m backend.nlp.build_dataset\n"
            "    python -m backend.nlp.train_intent"
        )

    try:
        from .retriever import get_retriever

        retriever = get_retriever()
    except FileNotFoundError:
        print("WARNING: no chapter index. Run build_lesson_index for chapter answers.\n")
        retriever = None

    # The database is only needed for catalogue and progress questions; without
    # it the rest of the report still runs.
    try:
        from ..database import db

        db["lessons"].find_one({})
        database = db
    except Exception:
        print("WARNING: MongoDB not reachable. Catalogue questions will be limited.\n")
        database = None

    from ..chatbot.responder import ChatResponder

    responder = ChatResponder(retriever=retriever, database=database)

    if args.ask:
        entry = answer(args.ask, args.grade, responder, pipeline, classifier, retriever)
        print_entry(entry)
        print()
        return

    print("=" * 72)
    print(f"SAMPLE OUTPUTS  (answering as a Grade {args.grade} student)")
    print("=" * 72)

    report = [
        f"# EduQuest AI &mdash; sample questions and answers",
        "",
        f"Generated {datetime.now().strftime('%d %B %Y')} for a Grade {args.grade} "
        "student, by running each question through the complete pipeline: "
        "preprocessing, intent classification, chapter retrieval and response "
        "generation.",
        "",
        f"Confidence threshold: {CONFIDENCE_THRESHOLD}. Below it the system "
        "reports that it is unsure rather than presenting a guess as fact.",
        "",
    ]

    for title, note, questions in SAMPLE_GROUPS:
        print(f"\n{'-' * 72}\n{title.upper()}\n{'-' * 72}")
        print(f"  {note}")

        report += [f"## {title}", "", note, ""]

        for question in questions:
            entry = answer(question, args.grade, responder, pipeline, classifier, retriever)
            print_entry(entry)
            report.append(render(entry))

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as fh:
        fh.write("\n".join(report))

    print(f"\n{'=' * 72}")
    print(f"  Written to {REPORT_FILE}")
    print(f"{'=' * 72}\n")


if __name__ == "__main__":
    main()
