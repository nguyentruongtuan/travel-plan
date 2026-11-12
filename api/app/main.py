import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .auth import CurrentUser, get_current_user
from .config import get_settings
from .db import close_db, init_indexes
from .routers import plans, uploads

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_indexes()
    yield
    await close_db()


app = FastAPI(title="Travel Plan API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plans.router)
app.include_router(uploads.router)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount(settings.public_upload_path, StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/me")
async def me(user: CurrentUser = Depends(get_current_user)):
    return {"uid": user.uid, "email": user.email, "name": user.name, "picture": user.picture}
