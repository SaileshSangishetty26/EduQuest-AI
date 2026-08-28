# Week 3 — MongoDB Schema

## users
- `_id`
- `username`
- `password_hash`
- `grade`
- `language`
- `points`

## lessons
- `id`
- `grade`
- `subject`
- `language`
- `title`
- `summary`
- `content`

## quizzes
- `id`
- `grade`
- `subject`
- `title`
- `questions[]`
  - `text`
  - `options[]`
  - `correct`

## quiz_attempts
- `_id`
- `user_id`
- `quiz_id`
- `answers[]`
- `correct`
- `total`
- `score`
- `submitted_at`

## progress
The current Week 5 implementation derives quiz-attempt progress from `quiz_attempts`. A dedicated progress document/collection is reserved for the later progress/gamification stages.
