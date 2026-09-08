"""
Expand the content bank from textbook PDFs.

The Week 2 content bank holds 2 chapters per subject per grade - enough to
demonstrate the app, not enough for the chatbot to answer much. This script
reads full textbook PDFs, works out where each chapter starts and ends, and
generates lessons.json entries for all of them.

Chapter boundaries come from the PDF's own bookmarks (the outline pane in a
PDF viewer) where they exist, which makes the whole thing automatic. Where they
do not, you supply page ranges by hand.

Workflow
--------
1. Put textbooks in data/chapters/ named <grade>-<subject>.pdf:

       data/chapters/g6-math.pdf
       data/chapters/g6-sci.pdf
       data/chapters/g7-eng.pdf

2. Check what can be detected automatically:

       python -m backend.nlp.build_lessons_from_pdfs --detect g6-math.pdf

3. If detection looks right, generate the chapter map for every book:

       python -m backend.nlp.build_lessons_from_pdfs --map

   Review data/chapters/chapter_map.json and fix anything wrong.

4. Generate the lesson entries:

       python -m backend.nlp.build_lessons_from_pdfs --generate

   This writes data/lessons_expanded.json. The 16 hand-written lessons are
   preserved exactly as they are - they have matching quizzes, and their
   summaries are better than anything generated from raw text.

5. Review, then swap it in and rebuild:

       copy data\\lessons_expanded.json data\\lessons.json
       python -m backend.nlp.ingest_pdfs
       python -m backend.nlp.build_lesson_index
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from .config import DATA_DIR

CHAPTERS_DIR = DATA_DIR / "chapters"
CHAPTER_MAP_FILE = CHAPTERS_DIR / "chapter_map.json"
LESSONS_FILE = DATA_DIR / "lessons.json"
OUTPUT_FILE = DATA_DIR / "lessons_expanded.json"

SUBJECT_CODES = {
    "math": "Mathematics",
    "maths": "Mathematics",
    "sci": "Science",
    "eng": "English",
    "tel": "Telugu",
}

# Chapters shorter than this are almost always front matter, indexes or
# answer keys rather than real content.
MIN_CHAPTER_PAGES = 3

SUMMARY_SENTENCES = 2
MAX_SUMMARY_CHARS = 260


def parse_book_name(filename: str) -> tuple[int, str] | None:
    """'g6-math.pdf' -> (6, 'Mathematics')."""
    match = re.match(r"^g(\d+)-([a-z]+)\.pdf$", filename.lower())
    if not match:
        return None
    grade = int(match.group(1))
    subject = SUBJECT_CODES.get(match.group(2))
    return (grade, subject) if subject else None


def detect_chapters(pdf_path: Path) -> list[dict]:
    """
    Read chapter titles and page ranges from the PDF's bookmarks.

    Returns [] when the PDF has no outline, which is the signal to fall back
    to supplying page ranges by hand.
    """
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    total_pages = len(reader.pages)

    try:
        outline = reader.outline
    except Exception:
        return []

    entries: list[tuple[str, int]] = []

    def walk(items) -> None:
        for item in items:
            if isinstance(item, list):
                walk(item)
                continue
            title = str(getattr(item, "title", "")).strip()
            if not title:
                continue
            try:
                page_index = reader.get_destination_page_number(item)
            except Exception:
                continue
            entries.append((title, page_index + 1))

    try:
        walk(outline)
    except Exception:
        return []

    if not entries:
        return []

    entries.sort(key=lambda e: e[1])

    chapters: list[dict] = []
    for i, (title, start) in enumerate(entries):
        end = entries[i + 1][1] - 1 if i + 1 < len(entries) else total_pages
        if end - start + 1 < MIN_CHAPTER_PAGES:
            continue
        chapters.append({"title": title, "pages": [start, end]})

    return chapters


def clean_title(raw: str) -> str:
    """Strip leading numbering: '3. Lines and Angles' -> 'Lines and Angles'."""
    title = re.sub(r"^\s*(chapter\s*)?\d+\s*[.:)-]?\s*", "", raw, flags=re.I)
    return title.strip() or raw.strip()


def make_summary(text: str) -> str:
    """First couple of sentences, as a stand-in for a written summary."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    summary = " ".join(sentences[:SUMMARY_SENTENCES]).strip()
    if len(summary) > MAX_SUMMARY_CHARS:
        summary = summary[:MAX_SUMMARY_CHARS].rsplit(" ", 1)[0] + "..."
    return summary


def cmd_detect(filename: str) -> None:
    pdf_path = CHAPTERS_DIR / filename
    if not pdf_path.exists():
        raise SystemExit(f"Not found: {pdf_path}")

    parsed = parse_book_name(filename)
    if parsed is None:
        print(f"WARNING: '{filename}' does not match the <grade>-<subject>.pdf")
        print("         pattern, e.g. g6-math.pdf. Rename it before generating.\n")

    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    print(f"File   : {filename}")
    print(f"Pages  : {len(reader.pages)}")

    chapters = detect_chapters(pdf_path)
    if not chapters:
        print("\nNo usable bookmarks in this PDF.")
        print("You will need to supply page ranges by hand in chapter_map.json.")
        print("Look at the table of contents and note where each chapter starts.")
        return

    print(f"\nDetected {len(chapters)} chapters from the PDF bookmarks:\n")
    for i, chapter in enumerate(chapters, start=1):
        pages = chapter["pages"]
        print(f"  {i:>2}. p{pages[0]:>3}-{pages[1]:<3}  {clean_title(chapter['title'])}")
    print("\nCheck these against the book's contents page before generating.")


def cmd_map() -> None:
    books = sorted(
        p for p in CHAPTERS_DIR.glob("*.pdf") if parse_book_name(p.name)
    )
    if not books:
        raise SystemExit(
            f"No textbooks found in {CHAPTERS_DIR}.\n"
            "Name them like g6-math.pdf, g7-sci.pdf."
        )

    chapter_map: dict[str, dict] = {}
    undetected: list[str] = []

    for pdf_path in books:
        grade, subject = parse_book_name(pdf_path.name)
        chapters = detect_chapters(pdf_path)
        if not chapters:
            undetected.append(pdf_path.name)
            print(f"  {pdf_path.name}: no bookmarks, skipped")
            continue

        code = pdf_path.stem.split("-")[1]
        for i, chapter in enumerate(chapters, start=1):
            lesson_id = f"g{grade}-{code}-{i}"
            chapter_map[lesson_id] = {
                "pdf": pdf_path.name,
                "pages": chapter["pages"],
                "title": clean_title(chapter["title"]),
                "grade": grade,
                "subject": subject,
            }
        print(f"  {pdf_path.name}: {len(chapters)} chapters")

    CHAPTER_MAP_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CHAPTER_MAP_FILE, "w", encoding="utf-8") as fh:
        json.dump(chapter_map, fh, indent=2, ensure_ascii=False)

    print(f"\nWrote {CHAPTER_MAP_FILE.name} with {len(chapter_map)} chapters")
    if undetected:
        print(f"  no bookmarks in: {', '.join(undetected)}")
        print("  add those chapters to chapter_map.json by hand")
    print("\nReview the file, then run --generate")


def cmd_generate() -> None:
    if not CHAPTER_MAP_FILE.exists():
        raise SystemExit("No chapter_map.json. Run --map first.")

    with open(CHAPTER_MAP_FILE, encoding="utf-8") as fh:
        chapter_map = json.load(fh)
    with open(LESSONS_FILE, encoding="utf-8") as fh:
        existing = json.load(fh)

    existing_ids = {lesson["id"] for lesson in existing}
    from .ingest_pdfs import clean_text, extract_text

    lessons = list(existing)
    added = 0
    skipped_existing = 0

    for lesson_id, entry in sorted(chapter_map.items()):
        if lesson_id in existing_ids:
            # Never overwrite a hand-written lesson. Those have matching
            # quizzes and much better summaries than anything generated here.
            skipped_existing += 1
            continue

        pdf_path = CHAPTERS_DIR / entry["pdf"]
        if not pdf_path.exists():
            print(f"  {lesson_id}: {entry['pdf']} missing, skipped")
            continue

        pages = entry.get("pages")
        text = clean_text(
            extract_text(pdf_path, (pages[0], pages[1]) if pages else None)
        )
        if len(text) < 300:
            print(f"  {lesson_id}: too little text ({len(text)} chars), skipped")
            continue

        lessons.append(
            {
                "id": lesson_id,
                "grade": entry["grade"],
                "subject": entry["subject"],
                "language": "en",
                "title": entry.get("title", lesson_id),
                "summary": make_summary(text),
                "content": text[:4000],
            }
        )
        added += 1

    lessons.sort(key=lambda l: (l["grade"], l["subject"], l["id"]))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(lessons, fh, indent=2, ensure_ascii=False)

    print(f"\nWrote {OUTPUT_FILE.name}")
    print(f"  kept {len(existing)} existing lessons unchanged "
          f"({skipped_existing} matched the chapter map)")
    print(f"  added {added} new chapters")
    print(f"  total {len(lessons)}")
    print("\nNOTE: new chapters have no quiz. quizzes.json still only covers")
    print("      the original hand-written lessons.")
    print("\nReview the file, then:")
    print("  copy data\\lessons_expanded.json data\\lessons.json")
    print("  python -m backend.nlp.ingest_pdfs")
    print("  python -m backend.nlp.build_lesson_index")


def main() -> None:
    parser = argparse.ArgumentParser(description="Expand lessons from textbook PDFs")
    parser.add_argument("--detect", metavar="FILE.pdf", help="inspect one textbook")
    parser.add_argument("--map", action="store_true", help="build chapter_map.json")
    parser.add_argument("--generate", action="store_true", help="build lessons_expanded.json")
    args = parser.parse_args()

    CHAPTERS_DIR.mkdir(parents=True, exist_ok=True)

    if args.detect:
        cmd_detect(args.detect)
    elif args.map:
        cmd_map()
    elif args.generate:
        cmd_generate()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
