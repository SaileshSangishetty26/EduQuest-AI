"""
Week 10 - Does the chatbot answer specific questions correctly?

Runs questions with known answers through the same pipeline the app uses
(backend/chatbot/service.py) and checks each reply:

    PASS   the exact answer contains the expected words
    NEAR   no exact answer shown, but the reply contains the expected words
    FAIL   neither

Off-topic questions pass only if the bot does NOT present an answer.

For textbook questions it also shows the answer model's raw best guess and its
score, whether or not it cleared ANSWER_THRESHOLD, and a table of how many
right and wrong answers each threshold would let through - so the threshold is
chosen from measurements rather than guessed.

Run from the project root:
    python -m backend.nlp.test_answers
"""

from __future__ import annotations

from .answerer import ANSWER_THRESHOLD, get_answer_extractor, is_question
from .retriever import RELEVANCE_THRESHOLD

# (subject, question, expected words - any one is enough; None = should not answer)
CASES = [
    ("Science", "What is the SI unit of length?", ["metre"]),
    ("Science", "What is the normal temperature of a healthy human body?", ["37"]),
    ("Science", "What are materials through which we can see things clearly called?", ["transparent"]),
    ("Science", "What is the process of separating grains from stalks called?", ["threshing"]),
    ("Science", "What is the change of water into water vapour called?", ["evaporation"]),
    ("Science", "Which disease is caused by a lack of vitamin C?", ["scurvy"]),
    ("Science", "What is the range of a laboratory thermometer?", ["110"]),
    ("Science", "Which star appears nearly stationary in the north?", ["pole star", "polaris"]),
    ("Science", "Between which planets do most asteroids revolve?", ["mars and jupiter"]),
    ("Science", "What is moving air called?", ["wind"]),
    ("Mathematics", "What are numbers with only two factors called?", ["prime"]),
    ("Mathematics", "Who first described the general method of adding fractions?", ["brahmagupta"]),
    ("Mathematics", "What is a bar graph with vertical bars called?", ["column graph"]),
    ("Mathematics", "What is Kaprekar's magic number?", ["6174"]),
    ("Mathematics", "What are positive numbers, negative numbers and zero together called?", ["integers"]),
    ("Mathematics", "What is the distance from the centre of a circle to the circle called?", ["radius"]),
    ("Mathematics", "What is 1/3 + 1/6?", ["1/2"]),
    ("Mathematics", "Is 91 a prime number?", ["no"]),
    ("Mathematics", "What is the HCF of 12 and 18?", ["6"]),
    ("Mathematics", "What is the area of a rectangle 5 m by 4 m?", ["20"]),
    ("English", "What is the name of the fox in the poem?", ["reynard"]),
    ("English", "Who taught Ila Sachani embroidery?", ["mother", "grandmother"]),
    ("English", "What did Mario's grandfather bet?", ["fruit chaat"]),
    ("English", "Who gave the neem tree the name Neem?", ["iranian"]),
    ("English", "What does the Sanskrit root yuj mean?", ["join", "unite"]),
    ("English", "When was the National War Memorial established?", ["2019"]),
    ("English", "What did Rama Natha have to collect?", ["dew"]),
    ("English", "Who was Gajaraj?", ["elephant"]),
    ("Telugu", "రైతు ఏమి చేస్తాడు?", ["పంట"]),
    ("Telugu", "నిజమైన స్నేహం అంటే ఏమిటి?", ["తోడుగా"]),
    ("Telugu", "కథలో ఏ జంతువులు ఉన్నాయి?", ["కాకి"]),
    ("Telugu", "సైనికులు ఏమి చేస్తారు?", ["కాపాడు", "రక్ష"]),
    ("Off-topic", "Who won the cricket match yesterday?", None),
    ("Off-topic", "What is the capital of France?", None),
    ("Off-topic", "What is the weather today?", None),
]


def _has(text: str | None, words: list[str]) -> bool:
    text = (text or "").lower()
    return any(w.lower() in text for w in words)


def _short(text: str, width: int = 46) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= width else text[: width - 3] + "..."


def main() -> None:
    from ..chatbot.service import ChatService
    from .pipeline import get_pipeline
    from .retriever import get_retriever

    try:
        from ..database import db

        db["lessons"].find_one({})
        database = db
    except Exception:
        database = None

    service = ChatService(database=database)
    pipeline = get_pipeline()
    retriever = get_retriever()
    extractor = get_answer_extractor()

    print("=" * 78)
    print("CHATBOT ANSWER TEST")
    print("=" * 78)
    print(f"  Answer threshold {ANSWER_THRESHOLD}   relevance threshold {RELEVANCE_THRESHOLD}\n")

    tally: dict[str, list[str]] = {}
    raw_scores: list[tuple[float, bool]] = []  # textbook questions: (best score, was it right)

    for subject, question, expected in CASES:
        result = service.reply(question, grade=6)
        answer = result.get("answer")

        if expected is None:
            verdict = "PASS" if answer is None else "FAIL"
        elif answer and _has(answer["text"], expected):
            verdict = "PASS"
        elif _has(result["reply"], expected):
            verdict = "NEAR"
        else:
            verdict = "FAIL"
        tally.setdefault(subject, []).append(verdict)

        source = answer["source"] if answer else result["intent"]
        shown = answer["text"] if answer else result["reply"]
        print(f"  {verdict:<4}  {subject:<11} {question}")
        print(f"        -> [{source}] {_short(shown, 60)}")

        # Raw model output for textbook questions, to tune the threshold.
        if expected and subject in ("Science", "Mathematics", "English") and is_question(question) \
                and result["intent"] not in ("calculation",):
            source = pipeline.preprocess(question).normalized_text or question
            vector = pipeline.retrieval_embedder.encode_one(source)
            passages = [p for p in retriever.search(vector, grade=6, top_k=3, query_text=question)
                        if p["score"] >= RELEVANCE_THRESHOLD]
            best = extractor.best_answer(question, passages) if passages else None
            if best:
                right = _has(best.text, expected)
                raw_scores.append((best.score, right))
                print(f"        model's best guess: '{_short(best.text, 40)}' score {best.score:.3f}"
                      f" ({'right' if right else 'wrong'})")
            else:
                print("        model's best guess: no relevant passage found")

    print("\n" + "-" * 78)
    print("SUMMARY")
    print("-" * 78)
    total_pass = 0
    total = 0
    for subject, verdicts in tally.items():
        passed = verdicts.count("PASS")
        near = verdicts.count("NEAR")
        total_pass += passed
        total += len(verdicts)
        print(f"  {subject:<12} {passed}/{len(verdicts)} exact" + (f", {near} near" if near else ""))
    print(f"  {'All':<12} {total_pass}/{total} ({total_pass * 100 // max(total, 1)}%)")

    if raw_scores:
        print("\n  Textbook answers by threshold (right shown / wrong shown):")
        for threshold in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7):
            right = sum(1 for s, ok in raw_scores if ok and s >= threshold)
            wrong = sum(1 for s, ok in raw_scores if not ok and s >= threshold)
            mark = "  <- current" if abs(threshold - ANSWER_THRESHOLD) < 1e-9 else ""
            print(f"    >= {threshold:.1f}   right {right:>2}   wrong {wrong:>2}{mark}")
    print()


if __name__ == "__main__":
    main()
