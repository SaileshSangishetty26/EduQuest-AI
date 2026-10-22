# Week 2–9 Implementation Status

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
| 9 | Concept-tagged quizzes for all 40 chapters (198 questions) | COMPLETE |
| 9 | Correct answers spread across A–D; answers hidden until submission | COMPLETE |
| 9 | Answer review with explanations after each quiz | COMPLETE |
| 9 | Per-question results stored with each attempt (for weak-concept analysis) | COMPLETE |
| 9 | Gamification engine: XP, levels, daily streaks, 11 badges, avatar rewards (server-side) | COMPLETE |
| 9 | Mark chapter as read (lesson completion tracking) | COMPLETE |
| 9 | Gamification UI: XP bar, badge showcase, rewards, XP log, leaderboard page | COMPLETE |
| 9 | Teacher dashboard (MongoDB aggregation: progress, quiz trends, weak concepts) | IN PROGRESS |
| 10 | Chatbot answers specific questions: exact answers from the textbook (DistilBERT-SQuAD) | COMPLETE (threshold to tune) |
| 10 | Maths calculations with working (fractions, integers, primes, HCF/LCM, perimeter/area) | COMPLETE |
| 10 | Telugu questions answered from the Telugu chapters | COMPLETE |
| 10 | One chat pipeline for the app, demo and tests (`backend/chatbot/service.py`) | COMPLETE |

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

## Week 9 so far: quizzes
Every chapter now has a quiz: 5 questions for each English, Maths and Science
chapter and 4 for each Telugu chapter, 198 in all. Questions are written in
`backend/quizzes/` (one file per subject) with the correct answer first and a
concept tag and explanation on each; `python -m backend.quizzes.build` turns
them into `data/quizzes.json`. Every answer was checked against the chapter
text extracted from the NCERT PDFs.

In the original 8 quizzes the correct answer was always option A and the quiz
page did not shuffle, so always choosing A scored 100%. The build step now
spreads correct answers across A–D (always choosing A scores 24%), the quiz
endpoints no longer send answers to the browser, and `POST /quiz-attempts`
returns a per-question review with explanations. Each attempt stores which
concepts were answered correctly, so the teacher dashboard can report weak
concepts without depending on the current option order.

## Week 9 so far: gamification
XP, levels, streaks and badges used to be computed in the browser from three
progress numbers (with "chapters completed" always 0 and the streak kept in
localStorage). They are now computed on the server by
`backend/gamification/engine.py`, which replays each student's history
(chapters marked as read and quiz attempts) in time order:

| Action | XP |
|---|---|
| Mark a chapter as read (first time) | +20 |
| Each correct answer, above your best earlier attempt at that quiz | +10 |
| First time a quiz is passed (60%+) | +25 |
| First 100% on a quiz | +25 |
| Each day with any learning activity | +10 |

Retaking a quiz you already aced earns nothing, so XP cannot be farmed, but
improving a weak score is rewarded. Levels are every 150 XP. The streak counts
consecutive days in Indian Standard Time. There are 11 badges (each shows its
progress while locked) and 7 reward avatars unlocked at levels 2-10; the server
refuses a reward avatar the student has not reached. The leaderboard ranks
students in a grade by XP (ties share a rank; teacher accounts are excluded).
The chatbot's progress answer and the recommendation engine read the same
data; recommendations now suggest the quiz for a chapter that has been read
but not tested.

Endpoints: `GET /api/gamification/{user_id}`, `GET /api/leaderboard?grade=6`,
`POST /api/lessons/{lesson_id}/complete`; `POST /api/quiz-attempts` now also
returns XP gained, new badges and any level-up.

## Chatbot: answering specific questions
Before, a factual question got the right chapter and a 60-word passage, but not
the answer itself, and Telugu questions were not understood at all. Each
message now goes through `backend/chatbot/service.py`:

1. **Telugu script** → `backend/nlp/telugu.py`: character n-gram TF-IDF over the
   Telugu chapter sentences, reply in Telugu. Character fragments rather than
   words because Telugu is agglutinative (రైతు / రైతులు / రైతుల share most
   characters).
2. **A calculation** → `backend/nlp/math_solver.py`: exact Fraction arithmetic
   for fractions and integers, prime checks, factors, prime factorisation,
   HCF/LCM, co-primes, and rectangle/square perimeter and area, with the
   working the chapter teaches.
3. **Everything else** → Week 6 preprocessing and Week 7 intent classifier, then
   semantic retrieval of the top 3 textbook passages.
4. **A factual question** → `backend/nlp/answerer.py`:
   `distilbert-base-cased-distilled-squad` reads those passages and points at
   the words that answer it. It can only quote the NCERT text, never invent;
   below `ANSWER_THRESHOLD` the passage is shown instead.
5. Otherwise the Week 7/8 rule-based reply. Homework questions still get the
   method, not the answer.

The chat endpoint previously never searched the textbook when the intent
classifier was unsure (only the demo script did); all three now share one
pipeline. `python -m backend.nlp.test_answers` checks 35 questions with known
answers across the four subjects plus off-topic questions, and prints how many
right and wrong answers each threshold lets through.

First measured run: 25/35 (71%). Maths calculations, Telugu and off-topic
were all correct. Of the 10 misses, 4 were questions the intent classifier
labelled off-topic before the answer model could see them (its own guess was
right for 3), and 6 were confidently wrong spans between look-alike
definitions (condensation for evaporation, composite for prime, translucent
for transparent). Changes after that run:

- Questions labelled off-topic are checked against the textbook first; an
  answer is given only if the textbook clearly supports it.
- Six passages are read instead of three, and each passage's best span is
  re-ranked by *support*: how many of the question's content words appear, in
  order, in the answer's sentence. Word order separates "water into vapour"
  (evaporation) from "water vapour into" (condensation).
- `test_answers --model ...` compares answer models on the same 35 questions;
  SQuAD 2.0 models (e.g. `deepset/roberta-base-squad2`) can also decline when
  a passage does not contain the answer.

Second run: 27/35 (77%). The off-topic check and word-order support fixed five
questions, but support was weighted too heavily (a sentence repeating the
question beat the real answer), and a rejected top candidate hid an acceptable
second one. Support now counts for 40% of the rank instead of 60%
(`RANK_BASE`), the first *acceptable* candidate is used, and the test prints
the top three candidates for every question.

## Still open
Week 9 teacher dashboard; Week 10 integration, testing and deployment. Still English-only, and the two Telugu chapters are tagged `"language": "en"` in lessons.json. The chat endpoint is stateless, so `clarification` cannot refer back to the previous turn. Study time is not recorded anywhere.
