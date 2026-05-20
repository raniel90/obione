"""Request-ID propagation + access log middleware."""
import logging
import time
import uuid

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from obione.settings import settings

_logger = logging.getLogger("obione.request")


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_id_and_access_log(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - started) * 1000
            _logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id, "method": request.method,
                    "path": request.url.path, "elapsed_ms": round(elapsed_ms, 2),
                },
            )
            raise
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers["x-request-id"] = request_id
        _logger.info(
            "request",
            extra={
                "request_id": request_id, "method": request.method,
                "path": request.url.path, "status": response.status_code,
                "elapsed_ms": round(elapsed_ms, 2),
            },
        )
        return response
