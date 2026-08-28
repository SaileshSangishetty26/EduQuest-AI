from pydantic import BaseModel, Field
from typing import Optional

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    grade: int
    language: str = "en"

class LoginRequest(BaseModel):
    username: str
    password: str

class PublicUser(BaseModel):
    id: str
    username: str
    grade: int
    language: str
