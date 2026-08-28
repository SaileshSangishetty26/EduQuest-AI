import hashlib, os, binascii
from fastapi import APIRouter, HTTPException
from ..database import users
from ..models.user import RegisterRequest, LoginRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return binascii.hexlify(salt).decode() + ":" + binascii.hexlify(digest).decode()

def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":")
        salt = binascii.unhexlify(salt_hex)
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
        return binascii.hexlify(check).decode() == digest_hex
    except Exception:
        return False

def public_user(doc):
    return {"id": str(doc["_id"]), "username": doc["username"], "grade": doc["grade"], "language": doc["language"]}

@router.post("/register")
def register(req: RegisterRequest):
    if req.grade not in [6,7]:
        raise HTTPException(400, "Grade must be 6 or 7")
    if req.language not in ["en","te","hi"]:
        raise HTTPException(400, "Unsupported language")
    if users.find_one({"username": req.username}):
        raise HTTPException(409, "Username already exists")
    doc = {"username": req.username, "password_hash": hash_password(req.password),
           "grade": req.grade, "language": req.language, "points": 0}
    result = users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"message":"Registration successful", "user":public_user(doc)}

@router.post("/login")
def login(req: LoginRequest):
    doc = users.find_one({"username": req.username})
    if not doc or not verify_password(req.password, doc["password_hash"]):
        raise HTTPException(401, "Invalid username or password")
    return {"message":"Login successful", "user":public_user(doc)}
