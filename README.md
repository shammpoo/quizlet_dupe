# FlashStudy - AI-Powered Flashcard Study Tool

A full-stack study tool that generates flashcards from your study materials using AI. Upload PDFs, Word documents, or paste text, and FlashStudy will create question-and-answer flashcards to help you study.

## Features

- **AI-Powered Generation** - Upload a PDF, DOCX, or TXT file (or paste text) and get flashcards automatically generated via OpenAI
- **Flashcard Management** - Create, edit, and delete flashcard sets with full CRUD support
- **Study Mode** - Interactive flip-card UI with keyboard navigation, shuffle, and progress tracking
- **Learning Filters** - Mark cards as "Known" or "Still Learning" and filter during study sessions
- **User Accounts** - Register and log in with JWT-based authentication

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Python / FastAPI
- **Database**: PostgreSQL via SQLAlchemy
- **AI**: OpenAI GPT-3.5 Turbo
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing

## Prerequisites

- Python 3.11+
- PostgreSQL running locally (or a remote connection string)
- An OpenAI API key

## Setup

1. **Clone the repo and install dependencies:**

   ```bash
   cd quizlet_dupe
   pip install -r requirements.txt
   ```

2. **Create a `.env` file** (copy from the template):

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/flashcards_db
   SECRET_KEY=some-long-random-secret-key
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Create the PostgreSQL database:**

   ```bash
   createdb flashcards_db
   ```

4. **Run the server:**

   ```bash
   uvicorn backend.main:app --reload
   ```

5. **Open your browser** to `http://localhost:8000` to use the app.

## API Endpoints

| Method | Endpoint                | Description                    |
|--------|-------------------------|--------------------------------|
| POST   | `/api/auth/register`    | Create a new account           |
| POST   | `/api/auth/login`       | Log in and get tokens          |
| POST   | `/api/auth/refresh`     | Refresh access token           |
| GET    | `/api/auth/me`          | Get current user info          |
| GET    | `/api/sets/`            | List all sets for current user |
| POST   | `/api/sets/`            | Create a new flashcard set     |
| GET    | `/api/sets/{id}`        | Get a set with its cards       |
| PUT    | `/api/sets/{id}`        | Update set title/description   |
| DELETE | `/api/sets/{id}`        | Delete a set                   |
| PUT    | `/api/sets/{id}/cards`  | Bulk update cards in a set     |
| POST   | `/api/generate/text`    | Generate cards from text       |
| POST   | `/api/generate/file`    | Generate cards from file upload|

## Keyboard Shortcuts (Study Mode)

- **Left/Right Arrow** - Previous/Next card
- **Space / Up / Down Arrow** - Flip card
