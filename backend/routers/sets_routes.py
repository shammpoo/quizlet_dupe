from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, FlashcardSet, Flashcard
from ..schemas import (
    FlashcardSetCreate, FlashcardSetUpdate, FlashcardSetOut,
    FlashcardSetDetail, CardsUpdate,
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/sets", tags=["sets"])


@router.get("/", response_model=list[FlashcardSetOut])
def list_sets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sets = db.query(FlashcardSet).filter(FlashcardSet.user_id == user.id).order_by(FlashcardSet.updated_at.desc()).all()
    results = []
    for s in sets:
        results.append(FlashcardSetOut(
            id=s.id,
            title=s.title,
            description=s.description,
            card_count=len(s.cards),
            created_at=s.created_at,
            updated_at=s.updated_at,
        ))
    return results


@router.post("/", response_model=FlashcardSetDetail, status_code=status.HTTP_201_CREATED)
def create_set(data: FlashcardSetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fs = FlashcardSet(title=data.title, description=data.description, user_id=user.id)
    db.add(fs)
    db.flush()

    for i, card in enumerate(data.cards):
        db.add(Flashcard(set_id=fs.id, front=card.front, back=card.back, position=i))

    db.commit()
    db.refresh(fs)
    return fs


@router.get("/{set_id}", response_model=FlashcardSetDetail)
def get_set(set_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fs = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == user.id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Set not found")
    return fs


@router.put("/{set_id}", response_model=FlashcardSetDetail)
def update_set(set_id: int, data: FlashcardSetUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fs = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == user.id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Set not found")

    if data.title is not None:
        fs.title = data.title
    if data.description is not None:
        fs.description = data.description
    fs.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(fs)
    return fs


@router.delete("/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_set(set_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fs = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == user.id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Set not found")
    db.delete(fs)
    db.commit()


@router.put("/{set_id}/cards", response_model=FlashcardSetDetail)
def update_cards(set_id: int, data: CardsUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fs = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.user_id == user.id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Set not found")

    db.query(Flashcard).filter(Flashcard.set_id == fs.id).delete()

    for i, card in enumerate(data.cards):
        db.add(Flashcard(set_id=fs.id, front=card.front, back=card.back, position=i))

    fs.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(fs)
    return fs
