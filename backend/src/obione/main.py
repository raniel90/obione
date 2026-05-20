"""FastAPI app factory."""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from obione.health.router import router as health_router
from obione.settings import settings
from obione.shared.exceptions import register_exception_handlers
from obione.shared.logging import configure_logging
from obione.shared.middleware import register_middleware


def create_app() -> FastAPI:
    configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)

    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        description="Backend for the ObiOne project observatory (MPO + Generative AI).",
        version="0.1.0",
    )

    register_middleware(app)
    register_exception_handlers(app)

    app.include_router(health_router)

    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/docs")

    return app


app = create_app()
