# Aprofundar a Camada de IA (§4.3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever a §4.3 (Camada de IA) do artigo, enxuta e explicativa, com os 5 papéis reais, um diagrama de fluxo simples e as técnicas/proveniência, corrigindo o erro factual (hoje diz "quatro papéis" incl. uma "Consultora" inexistente) e reconciliando o §7.

**Architecture:** O artigo é gerado por `build_sbc_docx.py` (python-docx) → `Artigo_ObiOne_SBC.docx`; o `.pdf` sai por LibreOffice; `artigo_obione.md` é o espelho. Cada mudança é uma edição no builder + espelho, verificada por readback (python-docx/grep) e QC visual, com commit por tarefa. Branch atual: `docs/artigo-ia-aprofundada`.

**Tech Stack:** Python 3 + python-docx 1.2, LibreOffice headless, poppler, git/gh.

---

## Fonte da verdade

Spec: `atividades/artigo/spec_aprofundar_ia.md`. Fatos do código já levantados (não reabrir o backend; usar os fatos abaixo verbatim):
- 5 papéis: Categorizadora (`/projects/{id}/ai/suggest-domain`), Observadora (`/suggest-observations`), Sintetizadora (`/discussions/{id}/ai/suggest-knowledge`), Conectora (`/domains/{id}/ai/synthesize`, implementada/não avaliada), Configuradora (`/ai/project-setup`).
- Técnicas: saída estruturada (Spring AI `.entity`), grounding na lente MPO (44 atributos do Quadro 37), anti-alucinação nos prompts (não inventar atributos; citar trecho literal), validação determinística em Java (descarta ids/domínios inválidos), `gpt-4o-mini`, temperatura 0,3, provedor `obione.llm.provider` (mock|openai).
- Pipeline: descrição → contexto + lente MPO → provedor de IA (saída estruturada) → `ai_suggestion_logs` (proveniência: provider, model, instante, aceite — reprodutibilidade) → revisão do consultor → observação/aprendizado (origem `AI_SUGGESTED`) só na aceitação humana. Taxa de aceite via `/ai/stats`.

## File Structure

- **Modify:** `atividades/artigo/build_sbc_docx.py` — helper `flow_box` novo; §4.3 reescrita; §5.2 renumerada; §7 reconciliado. Segue sendo um único arquivo (padrão do repo).
- **Modify:** `atividades/artigo/artigo_obione.md` — espelho: mesma reescrita em Markdown.
- **Generate:** `Artigo_ObiOne_SBC.docx` / `.pdf` (saídas).

## Regras de estilo (já vigentes)

- Sem em dash (—) no corpo (usar vírgulas, dois-pontos, parênteses; a seta `→` é permitida). A afiliação no topo mantém seus em dashes.
- `heading(text, new_page=True)` quebra página antes (não usado aqui). `subheading` = 12pt bold. `body(text, first=True)` = 1º parágrafo da seção (sem recuo). `caption` = Helvetica 10 bold centralizado (legenda). `table(headers, rows, widths=None)`.

---

### Task 1: Helper `flow_box` + reescrita da §4.3

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Adicionar o helper `flow_box`** logo após a definição de `figure(...)` (perto dos outros helpers):

```python
def flow_box(text):
    """Caixa única (bordada) com o fluxo em uma linha, setas → entre etapas.
    Um 'diagrama simples' de pipeline, sem imagem."""
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    t.autofit = False
    t.allow_autofit = False
    cell = t.rows[0].cells[0]
    cell.width = Cm(15.0)
    cell.paragraphs[0].clear()
    cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    _run(cell.paragraphs[0], text, size=11)
```

- [ ] **Step 2: Substituir TODO o bloco atual da §4.3** (o `subheading("4.3. Camada de IA")` + o único `body(...)` que menciona "quatro papéis" e "Consultora") por:

```python
subheading("4.3. Camada de IA")
body("A camada de IA é o principal diferencial do ObiOne e atua de forma assistiva sobre "
     "o ciclo de observação, conversa e aprendizado. Está organizada em cinco papéis; em "
     "todos, a saída é uma sugestão, nunca uma ação publicada automaticamente. A Tabela 3 "
     "resume os papéis, com suas entradas e saídas.", first=True)
caption("Tabela 3. Papéis da camada de IA, com entradas e saídas.")
table(
    ["Papel", "Função", "Entrada", "Saída"],
    [
        ["Categorizadora", "Sugere o domínio do projeto", "resumo, objetivo, domínios disponíveis", "domínio sugerido e confiança"],
        ["Observadora", "Sugere observações ancoradas no MPO", "resumo, objetivo, lente MPO, atributos prioritários", "observações mapeadas a atributos, com impacto e trecho literal"],
        ["Sintetizadora", "Rascunha um aprendizado a partir da conversa", "título, pergunta, contribuições", "rascunho com resumo, evidência e recomendação"],
        ["Conectora", "Sintetiza padrões entre projetos do domínio (implementada; não avaliada)", "resumos dos projetos do domínio", "padrões e lições anonimizados"],
        ["Configuradora", "Sugere o setup inicial no cadastro", "nome, descrição, objetivo", "domínio, atributos e fenômenos esperados"],
    ],
    widths=[3.0, 4.5, 3.75, 3.75])
body("O processamento de um projeto segue um fluxo comum. A partir do texto do projeto, o "
     "serviço assistente monta o contexto e injeta a lente do MPO, isto é, a lista dos 44 "
     "atributos do Quadro 37; aciona o provedor de IA, que devolve uma saída estruturada; "
     "registra a sugestão com sua proveniência; e a devolve ao consultor para revisão. A "
     "Figura 1 ilustra esse fluxo.", first=True)
flow_box("Descrição do projeto  →  Contexto + lente MPO (44 atributos)  →  "
         "Provedor de IA (mock ou OpenAI; saída estruturada)  →  Registro em "
         "ai_suggestion_logs (proveniência)  →  Revisão do consultor  →  "
         "Observação ou aprendizado")
caption("Figura 1. Pipeline da camada de IA.")
body("Três técnicas sustentam a confiabilidade das sugestões. A primeira é a saída "
     "estruturada: o modelo é obrigado a responder no formato de um objeto de dados, que "
     "o sistema mapeia diretamente, sem interpretação livre do texto. A segunda é o "
     "grounding pela lente do MPO, reforçado por instruções que orientam o modelo a não "
     "inventar atributos fora da lista fornecida e a citar o trecho literal do resumo que "
     "motivou cada observação. A terceira é uma validação determinística em código, que "
     "descarta identificadores de atributo ou de domínio inexistentes no catálogo antes de "
     "devolver a resposta. O provedor é configurável: um modo determinístico, sem chave e "
     "voltado a testes, e o provedor da OpenAI, com o modelo gpt-4o-mini e temperatura "
     "baixa, para uso real.", first=True)
body("A IA nunca escreve diretamente nas observações ou nos aprendizados. Ela apenas "
     "sugere e registra cada sugestão em um log de auditoria, com o provedor, o modelo, o "
     "instante e a indicação de aceite, o que dá reprodutibilidade ao uso da IA. A "
     "persistência só ocorre quando o consultor aceita a sugestão, e a observação é então "
     "gravada com a origem marcada como assistida pela IA. A taxa de aceite por tipo de "
     "sugestão é observável no sistema, permitindo acompanhar o quanto as sugestões são de "
     "fato aproveitadas.", first=True)
```

- [ ] **Step 3: Regenerar e verificar.**

Run:
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
d=Document("atividades/artigo/Artigo_ObiOne_SBC.docx")
full=[p.text for p in d.paragraphs]
for tb in d.tables:
    for r in tb.rows:
        for c in r.cells: full.append(c.text)
t="\n".join(full)
# erro factual removido
assert "quatro papéis" not in t, "ainda diz quatro papéis"
assert "Consultora apoia" not in t and "e a Consultora" not in t, "ainda menciona Consultora"
# 5 papéis presentes
for r in ["Categorizadora","Observadora","Sintetizadora","Conectora","Configuradora"]:
    assert r in t, f"papel ausente: {r}"
assert "cinco papéis" in t, "faltou 'cinco papéis'"
# tabela 3 papéis + figura 1
assert "Tabela 3. Papéis da camada de IA" in t, "caption Tabela 3 papéis ausente"
assert "Figura 1. Pipeline da camada de IA" in t, "Figura 1 ausente"
assert "ai_suggestion_logs" in t and "gpt-4o-mini" in t, "técnicas/proveniência ausentes"
assert "implementada; não avaliada" in t, "Conectora não marcada"
body=t.split("Resumo.",1)[1]
assert "—" not in body, "em dash no corpo"
print("OK task1")
PY
```
Expected: `OK task1`.

- [ ] **Step 4: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): aprofunda §4.3 Camada de IA (5 papéis, pipeline, técnicas, proveniência)"
```

---

### Task 2: Renumerar o comparativo (§5.2) Tabela 3 → Tabela 4

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Trocar a referência in-text.** Substituir:
```
     "respostas positivas. A Tabela 3 apresenta o comparativo por dimensão entre as duas "
```
por:
```
     "respostas positivas. A Tabela 4 apresenta o comparativo por dimensão entre as duas "
```

- [ ] **Step 2: Trocar a caption.** Substituir:
```
caption("Tabela 3. Médias por dimensão nas duas rodadas (escala 1 a 5, N=4 por rodada).")
```
por:
```
caption("Tabela 4. Médias por dimensão nas duas rodadas (escala 1 a 5, N=4 por rodada).")
```

- [ ] **Step 3: Regenerar e verificar (ordem das tabelas correta).**
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
d=Document("atividades/artigo/Artigo_ObiOne_SBC.docx")
caps=[p.text for p in d.paragraphs if p.text.startswith(("Tabela ","Figura "))]
print(caps)
# ordem esperada no corpo: Tabela 1 (participantes), Tabela 2 (rastreab.), Tabela 3 (papéis IA), Figura 1, Tabela 4 (comparativo), depois Apêndices (Tabela A.1, C.1)
assert "Tabela 1. Perfil dos participantes" in caps[0]
assert "Tabela 2. Amostra da rastreabilidade" in caps[1]
assert "Tabela 3. Papéis da camada de IA" in caps[2]
assert "Figura 1. Pipeline da camada de IA" in caps[3]
assert "Tabela 4. Médias por dimensão" in caps[4]
# nenhuma duplicata de "Tabela 3."
alltext="\n".join(p.text for p in d.paragraphs)
assert alltext.count("Tabela 3. Médias") == 0, "comparativo ainda numerado como Tabela 3"
print("OK task2")
PY
```
Expected: `OK task2`.

- [ ] **Step 4: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): renumera comparativo para Tabela 4 (papéis da IA passam a Tabela 3)"
```

---

### Task 3: Reconciliar o §7 sobre a Conectora

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Substituir a cláusula de trabalhos futuros.** Trocar:
```
     "MPO; e explorar a síntese cross-projeto, que reconhece padrões entre clientes e "
     "ficou fora do escopo deste estudo.")
```
por:
```
     "MPO; e avaliar a síntese cross-projeto (Conectora), já implementada com mitigações "
     "de anonimização e gate de publicação, cuja avaliação de valor permanece em aberto.")
```

- [ ] **Step 2: Regenerar e verificar.**
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
assert "ficou fora do escopo deste estudo" not in t, "§7 ainda diz que Conectora ficou fora do escopo"
assert "avaliar a síntese cross-projeto (Conectora), já implementada" in t, "§7 reconciliação ausente"
body=t.split("Resumo.",1)[1]
assert "—" not in body, "em dash no corpo"
print("OK task3")
PY
```
Expected: `OK task3`.

- [ ] **Step 3: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): §7 reconcilia Conectora (implementada com mitigações; avaliação em aberto)"
```

---

### Task 4: Sincronizar o markdown-espelho

**Files:**
- Modify: `atividades/artigo/artigo_obione.md`

- [ ] **Step 1: Substituir a §4.3 no markdown.** Localizar `### 4.3 Camada de IA` e o parágrafo único abaixo dele (que menciona "quatro papéis" e "Consultora"). Substituir o parágrafo por:
  - Parágrafo de abertura (mesmo texto do builder: "A camada de IA é o principal diferencial... A Tabela 3 resume os papéis...").
  - `**Tabela 3. Papéis da camada de IA, com entradas e saídas.**` seguido de uma tabela GFM com as MESMAS 5 linhas (Papel/Função/Entrada/Saída), a Conectora marcada "(implementada; não avaliada)".
  - Parágrafo do fluxo ("O processamento de um projeto segue um fluxo comum... A Figura 1 ilustra esse fluxo.").
  - O diagrama como linha de etapas: `**Figura 1. Pipeline da camada de IA.**` e, abaixo, a linha `Descrição do projeto → Contexto + lente MPO (44 atributos) → Provedor de IA (mock ou OpenAI; saída estruturada) → Registro em ai_suggestion_logs (proveniência) → Revisão do consultor → Observação ou aprendizado`.
  - Parágrafo de técnicas (mesmo texto do builder).
  - Parágrafo de human-in-the-loop + proveniência (mesmo texto do builder).

- [ ] **Step 2: Renumerar o comparativo no markdown.** Localizar `A Tabela 3 apresenta o comparativo` → `A Tabela 4 apresenta o comparativo`; e `**Tabela 3. Médias por dimensão...**` → `**Tabela 4. Médias por dimensão...**`.

- [ ] **Step 3: Reconciliar o §7 no markdown.** Trocar a cláusula `explorar a síntese cross-projeto, que reconhece padrões entre clientes e ficou fora do escopo deste estudo.` por `avaliar a síntese cross-projeto (Conectora), já implementada com mitigações de anonimização e gate de publicação, cuja avaliação de valor permanece em aberto.`.

- [ ] **Step 4: Verificar.**
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
python3 - <<'PY'
md=open("atividades/artigo/artigo_obione.md").read()
for k in ["cinco papéis","**Tabela 3. Papéis da camada de IA","Figura 1. Pipeline da camada de IA",
          "ai_suggestion_logs","gpt-4o-mini","implementada; não avaliada",
          "**Tabela 4. Médias por dimensão","A Tabela 4 apresenta o comparativo",
          "avaliar a síntese cross-projeto (Conectora)"]:
    assert k in md, f"faltou no markdown: {k}"
assert "quatro papéis" not in md and "Consultora apoia" not in md, "menção antiga remanescente"
assert "ficou fora do escopo deste estudo" not in md, "§7 markdown não reconciliado"
bad=[l for l in md.splitlines() if "—" in l and not ("Pernambuco" in l or "Recife" in l)]
assert not bad, f"em dash fora da afiliação: {bad}"
print("OK task4")
PY
```
Expected: `OK task4`.

- [ ] **Step 5: Commit.**
```bash
git add atividades/artigo/artigo_obione.md
git commit -m "docs(artigo): sincroniza markdown (§4.3 IA aprofundada, Tabela 4, §7 Conectora)"
```

---

### Task 5: Gerar PDF, QC visual, Desktop e finalizar

**Files:**
- Generate: `Artigo_ObiOne_SBC.pdf`; Copy: `~/Desktop/`

- [ ] **Step 1: Gerar o PDF.**
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
soffice --headless --convert-to pdf --outdir atividades/artigo atividades/artigo/Artigo_ObiOne_SBC.docx
pdfinfo atividades/artigo/Artigo_ObiOne_SBC.pdf | grep Pages
```
Expected: número de páginas (provável 16-18; crescimento de ~1 página vs. as 16 atuais).

- [ ] **Step 2: QC visual da §4.3.** Localizar e renderizar a página da §4.3 (a que contém "Papéis da camada de IA"):
```bash
PG=$(python3 - <<'PY'
import subprocess
out=subprocess.run(["pdftotext","-layout","atividades/artigo/Artigo_ObiOne_SBC.pdf","-"],capture_output=True,text=True).stdout
for i,pg in enumerate(out.split("\f"),1):
    if "Papéis da camada de IA" in pg: print(i); break
PY
)
echo "§4.3 na página $PG"
pdftoppm -png -f "$PG" -l "$PG" -r 90 atividades/artigo/Artigo_ObiOne_SBC.pdf /tmp/qc_ia
```
Conferir visualmente `/tmp/qc_ia-*.png`: a Tabela 3 (papéis) sem quebras feias; a Figura 1 (caixa de fluxo) legível numa linha/duas linhas; os parágrafos de técnicas e proveniência presentes.

- [ ] **Step 3: Verificação final.**
```bash
python3 - <<'PY'
from docx import Document
d=Document("atividades/artigo/Artigo_ObiOne_SBC.docx")
full=[p.text for p in d.paragraphs]
for tb in d.tables:
    for r in tb.rows:
        for c in r.cells: full.append(c.text)
t="\n".join(full)
body=t.split("Resumo.",1)[1]
assert "—" not in body, "em dash no corpo"
for k in ["cinco papéis","Tabela 3. Papéis da camada de IA","Figura 1. Pipeline da camada de IA",
          "Tabela 4. Médias por dimensão","avaliar a síntese cross-projeto (Conectora)"]:
    assert k in t, f"faltou {k}"
assert "quatro papéis" not in t and "ficou fora do escopo deste estudo" not in t
print("OK final")
PY
```
Expected: `OK final`.

- [ ] **Step 4: Copiar para o Desktop.**
```bash
cp atividades/artigo/Artigo_ObiOne_SBC.pdf ~/Desktop/Artigo_ObiOne_SBC.pdf
cp atividades/artigo/Artigo_ObiOne_SBC.docx ~/Desktop/Artigo_ObiOne_SBC.docx
```

- [ ] **Step 5: Commit final (docx + pdf).**
```bash
git add atividades/artigo/Artigo_ObiOne_SBC.docx atividades/artigo/Artigo_ObiOne_SBC.pdf
git commit -m "docs(artigo): regenera docx e PDF com §4.3 aprofundada"
git push
```

---

## Self-Review (cobertura da spec)

- §4.3 reescrita: tabela dos 5 papéis (Conectora marcada) + Figura 1 (fluxo) + técnicas + human-in-the-loop → Task 1. ✓
- Correção "quatro papéis/Consultora" → Task 1 (assert). ✓
- Renumeração papéis=Tabela 3 / comparativo=Tabela 4 → Tasks 1 e 2. ✓
- §7 Conectora reconciliada → Task 3. ✓
- Markdown sincronizado → Task 4. ✓
- PDF + QC + Desktop + crescimento ~1 página → Task 5. ✓
- Sem prompts verbatim, sem apêndice novo → nenhum task os adiciona. ✓

Sem placeholders. Nomes de helpers (`flow_box`, `table`, `caption`, `body`, `subheading`) consistentes. Strings de edição citadas verbatim do estado atual do builder.
