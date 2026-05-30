"""Shared test helpers."""

# A 200+ char placeholder description used by fixtures.
# Used to satisfy ProjectCreate.description min_length=200 in unit and e2e tests
# without bloating each call site with prose.
SAMPLE_DESCRIPTION = (
    "Descrição de teste do projeto cobrindo objetivos, escopo, prazos, "
    "entregáveis e principais riscos para fins de avaliação automatizada da "
    "extração dos 44 atributos do Quadro 37 do MPO durante a execução da suite."
)
