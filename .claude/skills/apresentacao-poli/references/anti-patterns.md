# Anti-patterns em apresentações acadêmicas

Lista de erros recorrentes detectados em apresentações geradas com assistência de IA. Use como checklist antes de imprimir/projetar. O script `scripts/qc_check.py` automatiza grande parte da verificação.

## 1. IDs internos como citação

❌ `Fonte: gao_texttosql_2024 (Spider, PVLDB)`
✅ `Fonte: Gao et al. (2024) — Spider, PVLDB`

`paper_id` é nomenclatura interna de catálogo (formato típico: `autor_palavra_AAAA`). Em apresentação, use sempre **Autor et al. (Ano)**.

**Regex de detecção**: `\b[a-z][a-z_]*_(19|20)\d{2}\b`

## 2. Refs a arquivos/paths do projeto

❌ `Documentação: rsl_docs/RESULTADOS_RSL.md`
✅ `Documentação: Resultados da RSL`

Caminhos de arquivo (`.md`, `.yaml`, `rsl_docs/`) são detalhe de implementação. O ouvinte não navega no repo durante a apresentação.

**Regex de detecção**: `\.(md|yaml|yml|json)\b` ou `/[a-z]+/[a-z]+\.[a-z]+`

## 3. Jargão de IA não documentado

❌ "Pipeline 3-skill", "screening automático (87,8% falsos positivos)", "Cohen's κ = 0,83" (quando o kappa foi humano-vs-IA), "assistência de LLM"
✅ "Triagem por título/abstract", "Revisão manual final", "Revisão por par" (se houve), remover métricas que só fazem sentido com IA na metodologia

Termos como `3-skill`, `screening automático`, `κ=0,83`, `NEEDS_HUMAN_REVIEW` indicam pipelines de IA usados na metodologia. Se você não vai apresentar isso como parte do trabalho, **remova** — orientador estranha e questiona.

Se a IA realmente foi usada e você quer ser transparente, **documente em uma seção dedicada** explicando o pipeline, métricas e limitações. Não solte termo solto.

**Regex de detecção**: `\b(3.skill|pipeline 3|screening autom[áa]tico|Cohen[' ]?s? [Kk]appa|κ\s*=|assist[êe]ncia de LLM|NEEDS_HUMAN_REVIEW)\b`

## 4. Fontes fora do padrão

❌ Trechos em `Courier New` (típico de "código" copy-paste de IDE)
❌ Trechos em Times, Calibri, ou outras
✅ Tudo em Arial — sem exceção em apresentações UPE/POLI

**Regex de detecção**: `run.font.name not in {'Arial', None}`

## 5. Travessões (em-dash —)

❌ `Fonte: Medeiros et al. (2023) — LLM chatbot Ford Fiesta — MDPI Vehicles`
✅ `Fonte: Medeiros et al. (2023) · LLM chatbot Ford Fiesta · MDPI Vehicles`

O em-dash (`—`, U+2014) é típico de geração por IA (modelos LLM tendem a usar). En-dashes em intervalos numéricos (`6–8 meses`) são OK.

**Regex de detecção**: `—`

## 6. Métricas IA-vs-humano sem explicação

❌ "Cohen's κ = 0,83 (concordância substantial)" sem dizer quem foram os 2 avaliadores
✅ Ou remover, ou explicar: "κ entre doutorando e IA: 0,83 (substantial) — mitiga viés de avaliador único"

Métricas de inter-rater agreement só fazem sentido se você explicar quem foram os raters e por que vale citar. Em reunião curta, geralmente é melhor remover.

## 7. Cards e textboxes sem caber conteúdo

❌ Card com altura fixa onde o texto vaza por baixo
❌ Textbox em zona de overlap com outra textbox

✅ Sempre verificar visualmente após qualquer edit de texto (especialmente trocas que ampliam o conteúdo). Use `python-pptx` para checar `shape.height` vs. estimativa de altura do texto.

## 8. Divisores "PARTE 01/02..." em reuniões curtas

❌ Em reunião de 12 minutos, ter 5 slides "PARTE 01/02/03/04/05" desperdiça ~1.5 min de overhead visual
✅ Use transição verbal: "Passando para a próxima parte..." enquanto avança para o próximo slide de conteúdo

Divisores fazem sentido em apresentações longas (>40 min) com público que precisa de "marcadores" claros.

## 9. Placeholders não preenchidos

❌ Slide final com `{{TITULO}}` ou `{{AUTOR}}` aparecendo
✅ Sempre rodar `qc_check.py` antes de apresentar

A skill define placeholders no formato `{{MAIUSCULAS}}`. O QC detecta qualquer não substituído.

**Regex de detecção**: `\{\{[A-Z_]+\}\}`

## 10. "Obrigado" sem ask

❌ Último slide só com "Obrigado / Discussão e perguntas"
✅ Em reunião com decisão pendente, slide final repete a ask: "Obrigado · Decisão necessária: [X, Y, Z]"

Não force o orientador a se lembrar do que você precisa decidir — coloque na frente dele uma última vez.
