import json
from openai import OpenAI

from ..config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an expert study assistant. Given study material, generate high-quality flashcards.
Return ONLY a JSON array of objects, each with "front" (question or term) and "back" (answer or definition).
Make the flashcards clear, concise, and useful for studying. Cover the key concepts in the material."""


def generate_flashcards(text: str, num_cards: int = 10) -> list[dict]:
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key is not configured. Set OPENAI_API_KEY in your .env file.")

    max_chars = 12000
    truncated = text[:max_chars] if len(text) > max_chars else text

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Generate exactly {num_cards} flashcards from the following material:\n\n{truncated}",
            },
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    content = response.choices[0].message.content.strip()

    # Handle markdown-wrapped JSON
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]  # remove opening ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines)

    cards = json.loads(content)

    if not isinstance(cards, list):
        raise ValueError("AI response was not a JSON array")

    validated = []
    for card in cards:
        if isinstance(card, dict) and "front" in card and "back" in card:
            validated.append({"front": str(card["front"]), "back": str(card["back"])})

    if not validated:
        raise ValueError("AI did not return any valid flashcards")

    return validated
