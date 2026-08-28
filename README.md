# EduQuest — Weeks 2–6

This is the actual implementation for the first six implementation weeks of the EduQuest project.

The original `eduquest.html` was treated as a prototype/reference. The final application is rebuilt with:

- React.js frontend
- Python FastAPI backend
- MongoDB database
- Week 2 structured datasets
- Week 3 requirements/design/API documentation
- Week 4 basic UI/backend/database setup
- Week 5 learning content + quiz submission/storage
- Week 6 NLP preprocessing pipeline (spaCy + NLTK) and DistilBERT embeddings

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

### 4. Week 6 NLP pipeline
Run these from the **project root**, not from `backend/`:

```bash
python -m backend.nlp.setup_nlp        # spaCy model + NLTK corpora + DistilBERT weights
python -m backend.nlp.build_dataset    # writes data/processed/
python -m backend.nlp.validate         # prints the validation report
```

To skip the 265 MB DistilBERT download and run preprocessing only:

```bash
python -m backend.nlp.setup_nlp --skip-model
python -m backend.nlp.build_dataset --skip-embeddings
```

The pipeline is also exposed for live demonstration at `/api/nlp/status`, `/api/nlp/preprocess` and `/api/nlp/embed`. See `docs/week6-nlp-preprocessing.md` for the full design notes and validation report.

## Important
The app is intentionally scoped to Week 6. Intent detection and the chatbot core are Week 7 and are not implemented yet.
