"""FastAPI dependencies for the extractions context."""
from obione.extractions.llm.factory import build_extractor
from obione.extractions.llm.port import AbstractExtractor
from obione.settings import settings


def get_extractor_for(project_name: str, document_name: str) -> AbstractExtractor:
    """Resolve the configured extractor (mock vs real provider) for one call."""
    return build_extractor(
        provider=settings.LLM_PROVIDER,
        project_name=project_name,
        document_name=document_name,
    )
