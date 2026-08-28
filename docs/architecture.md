# Week 3 — System Architecture

```text
+--------------------+
|    React.js UI     |
| Student interface  |
+---------+----------+
          |
          | REST / JSON
          v
+--------------------+
|     FastAPI        |
| Auth / Content /   |
| Quiz / Progress    |
+---------+----------+
          |
          v
+--------------------+
|      MongoDB       |
| users              |
| lessons            |
| quizzes            |
| quiz_attempts      |
| progress           |
+--------------------+

          +---------------------+
          | NLP / AI component  |
          | (later weeks)       |
          +---------------------+
```

The Week 3 design also includes a teacher dashboard and chatbot interaction as system components. Their advanced implementation is outside the Week 5 scope.
