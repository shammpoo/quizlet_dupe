from datetime import datetime
from pydantic import BaseModel, EmailStr


# ── Auth ──

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Flashcards ──

class FlashcardBase(BaseModel):
    front: str
    back: str


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardOut(FlashcardBase):
    id: int
    position: int

    model_config = {"from_attributes": True}


class FlashcardSetCreate(BaseModel):
    title: str
    description: str = ""
    cards: list[FlashcardCreate] = []


class FlashcardSetUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class FlashcardSetOut(BaseModel):
    id: int
    title: str
    description: str
    card_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FlashcardSetDetail(BaseModel):
    id: int
    title: str
    description: str
    cards: list[FlashcardOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CardsUpdate(BaseModel):
    cards: list[FlashcardCreate]


# ── Generation ──

class GenerateFromTextRequest(BaseModel):
    text: str
    num_cards: int = 10


class GeneratedCards(BaseModel):
    cards: list[FlashcardBase]
