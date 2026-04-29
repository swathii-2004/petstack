from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, users

app = FastAPI(title="ProxiMart API")

origins = [
    settings.FRONTEND_USER_URL,
    settings.FRONTEND_VENDOR_URL,
    settings.FRONTEND_ADMIN_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Validation already happens in config.py, but just ensuring database indexes
    await init_db()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(users.router)
