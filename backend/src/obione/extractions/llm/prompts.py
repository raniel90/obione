"""Prompt construction for the MPO extraction call.

Messages are PT-BR. The LLM picks up per-attribute hints from the
ProjetoExtraido field descriptions (Instructor forwards them in the schema).
"""


def build_extraction_messages(
    *, doc_text: str, project_name: str, document_name: str
) -> list[dict]:
    system = (
        "Você é um analista do MPO (Modelo de Observatório de Projetos, Vieira 2022). "
        "Sua tarefa é extrair os 44 atributos do Quadro 37 de um documento .docx "
        "real de consultoria. Use as descrições dos campos como guia. "
        "Quando o documento NÃO mencionar o atributo, retorne null — nunca invente. "
        "Mantenha o texto na língua original (PT-BR). Datas em ISO 8601 (YYYY-MM-DD)."
    )
    user = (
        f"Projeto: {project_name}\n"
        f"Documento: {document_name}\n\n"
        f"===CONTEUDO===\n{doc_text}\n===FIM==="
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
