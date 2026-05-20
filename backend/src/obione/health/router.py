"""Health endpoints. /health is liveness (no DB); /health/db hits Postgres."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from obione.shared.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def liveness() -> dict:
    return {"status": "ok"}


@router.get("/db")
def db_check(db: Annotated[Session, Depends(get_db)]) -> dict:
    version = db.execute(text("SELECT version()")).scalar_one()
    return {"status": "ok", "postgres": version}
