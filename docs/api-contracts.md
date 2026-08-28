# Week 3 — API Contracts

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create student account |
| POST | `/api/auth/login` | Authenticate student |
| GET | `/api/lessons` | Filter lessons by grade/subject/language |
| GET | `/api/lessons/{id}` | Get one lesson |
| GET | `/api/quizzes` | Filter quizzes |
| GET | `/api/quizzes/{id}` | Get one quiz |
| POST | `/api/quiz-attempts` | Submit quiz answers and store result |
| GET | `/api/progress/{user_id}` | Return quiz progress |
| GET | `/api/health` | Backend/database health check |
