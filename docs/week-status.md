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
| 8 | Chapter PDF ingestion pipeline | COMPLETE (not yet run on real textbooks) |

See `docs/week6-nlp-preprocessing.md`, `docs/week7-intent-detection.md` and
`docs/week8-chatbot-recommendations.md` for the design notes and measured
results.

Headline numbers after Week 8: intent classification 89.1% across 12 intents
(5-fold CV averaged over 5 seeds, 8.3% baseline), lesson retrieval 10/10 top-1
with on-topic and off-topic scores cleanly separated.

## Intentionally postponed
Week 9 gamification and teacher dashboard; Week 10 integration, testing and deployment.

Carried into Week 9: adaptive quizzing needs a larger, concept-tagged question pool — the 16 quizzes hold only 62 questions between them with no tags. The content bank is still 16 chapters; the PDF expansion tooling is written but the NCERT portal was unreachable. Still English-only, and the four Telugu chapters remain tagged `"language": "en"` in lessons.json, which looks like a data error. The chat endpoint is stateless, so `clarification` cannot refer back to the previous turn. Study time is not recorded anywhere.
