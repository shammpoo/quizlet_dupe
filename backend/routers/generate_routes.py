from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..models import User
from ..schemas import GenerateFromTextRequest, GeneratedCards, FlashcardBase
from ..auth import get_current_user
from ..services.ai_service import generate_flashcards
from ..services.file_parser import parse_file

router = APIRouter(prefix="/api/generate", tags=["generate"])


@router.post("/text", response_model=GeneratedCards)
def generate_from_text(
    data: GenerateFromTextRequest,
    user: User = Depends(get_current_user),
):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        cards = generate_flashcards(data.text, data.num_cards)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards. Please try again.")

    return GeneratedCards(cards=[FlashcardBase(**c) for c in cards])


@router.post("/file", response_model=GeneratedCards)
async def generate_from_file(
    file: UploadFile = File(...),
    num_cards: int = Form(10),
    user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    # 10 MB limit
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        text = parse_file(file_bytes, file.content_type or "", file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file")

    try:
        cards = generate_flashcards(text, num_cards)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards. Please try again.")

    return GeneratedCards(cards=[FlashcardBase(**c) for c in cards])
