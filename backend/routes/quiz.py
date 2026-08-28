from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..database import quizzes, quiz_attempts, progress, users

router = APIRouter(tags=["Quiz"])

class QuizAttemptRequest(BaseModel):
    user_id: str
    quiz_id: str
    answers: list[int]

@router.post("/quiz-attempts")
def submit_quiz(req: QuizAttemptRequest):
    quiz=quizzes.find_one({"id":req.quiz_id})
    if not quiz: raise HTTPException(404,"Quiz not found")
    correct=0
    for i,q in enumerate(quiz["questions"]):
        if i < len(req.answers) and req.answers[i] == q["correct"]:
            correct += 1
    total=len(quiz["questions"])
    score=round(correct*100/total) if total else 0
    attempt={"user_id":req.user_id,"quiz_id":req.quiz_id,"answers":req.answers,
             "correct":correct,"total":total,"score":score,
             "submitted_at":datetime.now(timezone.utc)}
    quiz_attempts.insert_one(attempt)
    users.update_one({"_id":__import__("bson").ObjectId(req.user_id)}, {"$inc":{"points":score}})
    return {"score":score,"correct":correct,"total":total}

@router.get("/progress/{user_id}")
def get_progress(user_id:str):
    from bson import ObjectId
    attempts=list(quiz_attempts.find({"user_id":user_id},{"_id":0,"score":1}))
    return {
        "lessons_completed": 0,
        "quiz_attempts": len(attempts),
        "average_score": round(sum(x["score"] for x in attempts)/len(attempts)) if attempts else 0
    }
