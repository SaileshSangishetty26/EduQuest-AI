"""
Week 7 - The chatbot endpoint.

Receives a student query, runs it through the Week 6 NLP pipeline and the
Week 7 intent classifier, and returns an appropriate response.

Request flow
------------
    message
      -> preprocess          (Week 6: clean, tokenize, lemmatize)
      -> embed               (Week 6: DistilBERT, 768-d)
      -> classify            (Week 7: linear head -> intent + confidence)
      -> retrieve            (Week 7: semantic lesson search)
      -> respond             (Week 7: rule-based reply per intent)

Everything is lazy-loaded, so importing this router does not slow server
startup. The first chat request pays the model-loading cost.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..chatbot.responder import ChatResponder
from ..database import db
from ..models.chat import ChatRequest, ChatResponse, ChatStatusResponse
from ..nlp.classifier import CONFIDENCE_THRESHOLD, get_classifier
from ..nlp.config import EMBEDDINGS_FILE
from ..nlp.pipeline import get_pipeline
from ..nlp.retriever import LESSON_INDEX_FILE, get_retriever

router = APIRouter(prefix="/chat", tags=["Chatbot (Week 7)"])

_MODEL_MISSING = (
    "The intent classifier has not been trained yet. From the project root run:\n"
    "  python -m backend.nlp.build_dataset\n"
    "  python -m backend.nlp.train_intent\n"
    "  python -m backend.nlp.build_lesson_index"
)


@router.get("/status", response_model=ChatStatusResponse)
def chat_status():
    """Whether the chatbot's models are trained and available."""
    intents: list[str] = []
    classifier_ready = True
    try:
        intents = get_classifier().labels
    except FileNotFoundError:
        classifier_ready = False

    return ChatStatusResponse(
        classifier_ready=classifier_ready,
        lesson_index_ready=LESSON_INDEX_FILE.exists(),
        intents=intents,
        confidence_threshold=CONFIDENCE_THRESHOLD,
    )


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    try:
        classifier = get_classifier()
    except FileNotFoundError:
        raise HTTPException(503, _MODEL_MISSING)

    pipeline = get_pipeline()

    processed = pipeline.preprocess(payload.message)
    source = processed.normalized_text or payload.message

    # Two embeddings, because the two tasks use different checkpoints.
    # See backend/nlp/config.py for the measurements behind that choice.
    intent_vector = pipeline.embedder.encode_one(source)

    intent, confidence = classifier.predict(intent_vector)
    top_intents = classifier.predict_top_k(intent_vector, k=3)

    try:
        retriever = get_retriever()
    except FileNotFoundError:
        retriever = None

    # Only pay for the retrieval model when the intent actually needs a lesson.
    needs_lesson = intent in {
        "definition",
        "concept_explanation",
        "example_request",
        "formula_help",
        "homework_help",
        "clarification",
    }
    retrieval_vector = (
        pipeline.retrieval_embedder.encode_one(source)
        if retriever is not None and needs_lesson and confidence >= CONFIDENCE_THRESHOLD
        else None
    )

    responder = ChatResponder(retriever=retriever, database=db)
    result = responder.respond(
        intent=intent,
        confidence=confidence,
        query_vector=retrieval_vector,
        grade=payload.grade,
        user_id=payload.user_id,
        query_text=payload.message,
    )

    # Log the interaction. The Week 8 recommender reads this to work out which
    # chapters a student keeps asking about, which is a signal of struggle that
    # quiz scores alone do not capture.
    if payload.user_id:
        try:
            db["chat_history"].insert_one(
                {
                    "user_id": payload.user_id,
                    "message": payload.message,
                    "intent": intent,
                    "confidence": round(confidence, 4),
                    "understood": result["understood"],
                    "lesson_id": (result["lesson"] or {}).get("id"),
                    "asked_at": datetime.now(timezone.utc),
                }
            )
        except Exception:
            # Logging must never break the reply the student is waiting for.
            pass

    return ChatResponse(
        reply=result["reply"],
        intent=intent,
        confidence=round(confidence, 4),
        understood=result["understood"],
        lesson=result["lesson"],
        top_intents=[(name, round(prob, 4)) for name, prob in top_intents],
    )
