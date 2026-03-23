import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/flashcards_db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"
