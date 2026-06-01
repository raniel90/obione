"""FastAPI app factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from obione.auth.router import router as auth_router
from obione.comments.router import comment_router
from obione.comments.router import project_router as comments_project_router
from obione.drafts.router import draft_router
from obione.drafts.router import project_router as drafts_project_router
from obione.exports.router import router as exports_router
from obione.extractions.router import router as extractions_router
from obione.feed.router import router as feed_router
from obione.health.router import router as health_router
from obione.likert.router import router as likert_router
from obione.portfolio.router import router as portfolio_router
from obione.projects.router import router as projects_router
from obione.settings import settings
from obione.shared.exceptions import register_exception_handlers
from obione.shared.logging import configure_logging
from obione.shared.middleware import register_middleware
from obione.themes.router import project_router as themes_project_router
from obione.themes.router import suggestion_router as themes_suggestion_router
from obione.visibility.router import router as visibility_router


def create_app() -> FastAPI:
    configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)

    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        description="Backend for the ObiOne project observatory (MPO + Generative AI).",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_middleware(app)
    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(projects_router)
    app.include_router(extractions_router)
    app.include_router(comments_project_router)
    app.include_router(comment_router)
    app.include_router(feed_router)
    app.include_router(exports_router)
    app.include_router(likert_router)
    app.include_router(drafts_project_router)
    app.include_router(draft_router)
    app.include_router(visibility_router)
    app.include_router(themes_project_router)
    app.include_router(themes_suggestion_router)
    app.include_router(portfolio_router)

    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/docs")

    return app


app = create_app()
