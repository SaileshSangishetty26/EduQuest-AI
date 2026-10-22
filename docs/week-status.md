# Week 2–8 Implementation Status

| Week | Requirement area | Status |
|---|---|---|
| 2 | Learning content dataset | COMPLETE |
| 2 | Quiz dataset | COMPLETE |
| 2 | Sample student queries | COMPLETE |
| 2 | Intent-labelled dataset | COMPLETE |
| 3 | Functional/non-functional requirements | COMPLETE |
| 3 | System architecture | COMPLETE |
| 3 | MongoDB schema | COMPLETE |
| 3 | React ↔ FastAPI API contracts | COMPLETE |
| 3 | Chatbot/teacher-dashboard design | COMPLETE (design only) |
| 4 | React.js project | COMPLETE |
| 4 | FastAPI skeleton | COMPLETE |
| 4 | MongoDB connection | COMPLETE |
| 4 | Registration/login | COMPLETE |
| 4 | Grade/language selection | COMPLETE |
| 4 | Basic development structure | COMPLETE |
| 5 | Learning content through FastAPI | COMPLETE |
| 5 | Lesson browsing/viewing | COMPLETE |
| 5 | Quiz attempt interface | COMPLETE |
| 5 | Store quiz responses/results | COMPLETE |
| 6 | Text cleaning and normalisation | COMPLETE |
| 6 | Tokenization (NLTK) | COMPLETE |
| 6 | Stop-word removal with intent keep-list | COMPLETE |
| 6 | Lemmatization + POS tagging (spaCy) | COMPLETE |
| 6 | DistilBERT contextual embeddings | COMPLETE |
| 6 | Pipeline validation on sample queries | COMPLETE |
| 7 | Query dataset relabelled and expanded (150 queries) | COMPLETE |
| 7 | Intent classifier trained on DistilBERT embeddings | COMPLETE |
| 7 | Held-out evaluation, cross-validation, confusion matrix | COMPLETE |
| 7 | Semantic lesson retrieval | COMPLETE |
| 7 | FastAPI chatbot endpoint | COMPLETE |
| 8 | React chat interface wired to the NLP engine | COMPLETE |
| 8 | Rule-based recommendation engine (5 rules) | COMPLETE |
| 8 | Recommendations panel on the dashboard | COMPLETE |
| 8 | Chat history logged for NLP-driven recommendations | COMPLETE |
| 8 | Section-level retrieval (95 sections) | COMPLETE |
| 8 | Chapter PDF ingestion pipeline | COMPLETE |
| 8+ | Grade 6 NCERT textbooks ingested (English, Maths, Science: 38 chapters, 3,579 passages) | COMPLETE |
| 8+ | Change preferred language after registration (settings panel) | COMPLETE |
| 8+ | Scope narrowed to Grade 6 only | COMPLETE |

See `docs/week6-nlp-preprocessing.md`, `docs/week7-intent-detection.md` and
`docs/week8-chatbot-recommendations.md` for the design notes and measured
results.

Headline numbers after Week 8: intent classification 89.1% across 12 intents
(5-fold CV averaged over 5 seeds, 8.3% baseline). Retrieval is checked with
`python -m backend.nlp.test_retrieval`: 10 on-topic and 3 off-topic probes,
all against Grade 6 chapters.

## Scope: Grade 6 only
The team decided to cover a single grade. The content bank is the complete
Grade 6 NCERT set — 16 English, 10 Mathematics and 12 Science chapters taken
from the textbook PDFs, plus 2 Telugu chapters — 40 in all. The 8 Grade 7
chapters and their quizzes were removed, the grade picker was taken out of
registration and settings, and `python -m backend.seed` moves any existing
account to Grade 6. The `grade` field stays on users, lessons and quizzes so
another grade could be added later without a schema change.

Chapters are listed in textbook order everywhere (`backend/content_order.py`).
Lesson ids end in the chapter number, and sorting them as text had put
chapter 10 before chapter 2, so the Lessons page showed wrong chapter numbers.

## Intentionally postponed
Week 9 gamification and teacher dashboard; Week 10 integration, testing and deployment.

Carried into Week 9: only 8 of the 40 chapters have a quiz (34 questions in all, with no concept tags), so adaptive quizzing first needs quizzes for the other chapters and tagged questions. Still English-only, and the two Telugu chapters are tagged `"language": "en"` in lessons.json. The chat endpoint is stateless, so `clarification` cannot refer back to the previous turn. Study time is not recorded anywhere.
