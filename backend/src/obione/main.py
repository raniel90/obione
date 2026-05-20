"""FastAPI app factory. Modules will register routers here in later tasks."""
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        version="0.1.0",
    )

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
