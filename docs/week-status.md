# Week 2–6 Implementation Status

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

See `docs/week6-nlp-preprocessing.md` for the Week 6 design and validation report.

## Intentionally postponed
Week 7 intent detection and chatbot core; later recommendation/gamification/integration/deployment work.

Carried into Week 7 from Week 6: the query dataset has only 5 examples per intent, and it is English-only — the regional-language requirement from Week 2 still needs multilingual query data and a multilingual embedding model.
