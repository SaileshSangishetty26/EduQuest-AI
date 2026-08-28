# EduQuest — Weeks 2–5

This is the actual implementation for the first five implementation weeks of the EduQuest project.

The original `eduquest.html` was treated as a prototype/reference. The final application is rebuilt with:

- React.js frontend
- Python FastAPI backend
- MongoDB database
- Week 2 structured datasets
- Week 3 requirements/design/API documentation
- Week 4 basic UI/backend/database setup
- Week 5 learning content + quiz submission/storage

## Run

### 1. MongoDB
Install/start MongoDB locally, or use MongoDB Atlas.

### 2. Backend
Open a terminal in `backend/`:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn main:app --reload
```

If Python's package execution complains about relative imports, run the backend from the project root with:

```bash
uvicorn backend.main:app --reload
```

For the seed command from project root:

```bash
python -m backend.seed
```

### 3. Frontend
Open a second terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Important
The app is intentionally scoped to Week 5. Advanced NLP processing and intent detection are not implemented yet because those are assigned to later weeks in the official plan.
