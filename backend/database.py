import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017"))
db = client[os.getenv("MONGODB_DATABASE", "eduquest")]

users = db["users"]
lessons = db["lessons"]
quizzes = db["quizzes"]
quiz_attempts = db["quiz_attempts"]
progress = db["progress"]

def ensure_indexes():
    users.create_index("username", unique=True)
    lessons.create_index([("grade", 1), ("subject", 1), ("language", 1)])
    quizzes.create_index([("grade", 1), ("subject", 1)])
    quiz_attempts.create_index([("user_id", 1), ("quiz_id", 1)])
    progress.create_index("user_id", unique=True)
