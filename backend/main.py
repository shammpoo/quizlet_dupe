from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .routers import auth_routes, sets_routes, generate_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Flashcard Study Tool", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(sets_routes.router)
app.include_router(generate_routes.router)

project_root = Path(__file__).resolve().parent.parent

app.mount("/frontend", StaticFiles(directory=str(project_root / "frontend")), name="frontend")
app.mount("/", StaticFiles(directory=str(project_root), html=True), name="root")
