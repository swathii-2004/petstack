from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, connect_db
from app.routers import auth, admin, products, orders, webhooks
from app.routers import pets, vets, appointments, prescriptions, chat
from app.services.product_service import ensure_product_index
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("petstack")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage Motor connection pool across the application lifetime."""
    logger.info("Starting up — connecting to MongoDB...")
    await connect_db()
    from app.database import get_database
    await ensure_product_index(get_database())
    logger.info("Startup complete. PetStack API is ready.")
    yield
    logger.info("Shutting down — closing MongoDB connection.")
    await close_db()


app = FastAPI(
    title="PetStack API",
    description="Backend API for the PetStack pet-services platform.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logger middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s  (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body = await request.json()
    except Exception:
        body = "Could not parse body"
    logger.error(f"Validation error for {request.method} {request.url}")
    logger.error(f"Errors: {exc.errors()}")
    logger.error(f"Body: {body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )



# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(webhooks.router)
app.include_router(pets.router)
app.include_router(vets.router)
app.include_router(appointments.router)
app.include_router(prescriptions.router)
app.include_router(chat.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Liveness probe — returns ``{"status": "ok"}``."""
    return {"status": "ok"}
