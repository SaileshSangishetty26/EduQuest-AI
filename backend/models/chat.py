from pydantic import BaseModel, Field
from typing import List, Optional, Tuple


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    user_id: Optional[str] = None
    grade: Optional[int] = None
    language: str = "en"


class LessonRef(BaseModel):
    id: str
    title: str
    subject: str
    grade: int


class ChatResponse(BaseModel):
    reply: str
    intent: str
    confidence: float
    understood: bool
    lesson: Optional[LessonRef] = None
    top_intents: List[Tuple[str, float]] = []


class ChatStatusResponse(BaseModel):
    classifier_ready: bool
    lesson_index_ready: bool
    intents: List[str] = []
    confidence_threshold: float
