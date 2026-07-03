# Enriquecimento do Artigo ObiOne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar e enriquecer o artigo ObiOne no template SBC (layout do professor) com Método como seção própria, Implementação proporcional e Apêndices A/B/C, gerando docx + PDF atualizados.

**Architecture:** O artigo é gerado por um builder Python (`build_sbc_docx.py`, python-docx) que produz `Artigo_ObiOne_SBC.docx`; o `.pdf` sai por LibreOffice headless; `artigo_obione.md` é um espelho em Markdown. Toda mudança de conteúdo é uma edição no builder + espelho, verificada por *readback* (python-docx / grep) e QC visual (pdftoppm), com commit por tarefa no PR #89 (branch `docs/artigo-obione-draft`).

**Tech Stack:** Python 3 + python-docx 1.2, LibreOffice (`soffice --headless`), poppler (`pdftoppm`/`pdfinfo`), git/gh.

---

## Referência de conteúdo

Fonte da verdade: `atividades/artigo/spec_artigo_enriquecido.md`. Fontes de dados:
- Rastreabilidade requisitos→MPO: `atividades/requisitos.md` (linhas "Rastreabilidade MPO" por RF).
- Prints de telas: `atividades/apresentacoes/prints/` (`01-home.png` … `06-wizard.png`).
- Docs de arquitetura: `atividades/arquitetura_backend.md`, `arquitetura_pipeline.md`, `arquitetura_diagrama.md`.

**Citação nova (verificada):** Sommerville, I. (2016) "Software Engineering", 10ª ed., Pearson Education, Boston. (Engenharia de requisitos: Cap. 4.)

**Fato do stack (grounding §4.4):** o frontend usa `@lovable.dev/vite-tanstack-config` (ver `frontend/vite.config.ts`) — Lovable foi usado na prototipação/scaffold; descrever com precisão.

## File Structure

- **Modify:** `atividades/artigo/build_sbc_docx.py` — builder canônico; recebe as novas seções, subseções, helpers de hyperlink e imagem, e as tabelas dos apêndices. Continua sendo um único arquivo (padrão atual do repo).
- **Modify:** `atividades/artigo/artigo_obione.md` — espelho em Markdown; reescrito para bater com a nova estrutura.
- **Generate:** `atividades/artigo/Artigo_ObiOne_SBC.docx` e `Artigo_ObiOne_SBC.pdf` (saídas; não editar à mão).
- **No-touch:** código do produto (`backend/`, `frontend/`), demais docs.

## Helpers a adicionar no builder (usados nos apêndices)

Adicionar perto dos outros helpers (após `reference(...)`):

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def add_hyperlink(paragraph, url, text):
    """Insere um hyperlink clicável (azul, sublinhado) num parágrafo."""
    part = paragraph.part
    r_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hlink = OxmlElement("w:hyperlink")
    hlink.set(qn("r:id"), r_id)
    new_run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    color = OxmlElement("w:color"); color.set(qn("w:val"), "1155CC"); rPr.append(color)
    u = OxmlElement("w:u"); u.set(qn("w:val"), "single"); rPr.append(u)
    rFonts = OxmlElement("w:rFonts"); rFonts.set(qn("w:ascii"), "Times New Roman"); rFonts.set(qn("w:hAnsi"), "Times New Roman"); rPr.append(rFonts)
    sz = OxmlElement("w:sz"); sz.set(qn("w:val"), "24"); rPr.append(sz)  # 12pt = 24 half-points
    new_run.append(rPr)
    t = OxmlElement("w:t"); t.text = text; new_run.append(t)
    hlink.append(new_run)
    paragraph._p.append(hlink)

def link_line(label, url):
    """Parágrafo 'label: <hyperlink>' no corpo (Times 12, justificado)."""
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(3)
    _run(p, f"{label}: ")
    add_hyperlink(p, url, url)

def figure(img_path, caption_text, width_cm=13.0):
    """Insere imagem centralizada + legenda estilo SBC (Helvetica 10 bold)."""
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    run = p.add_run(); run.add_picture(str(img_path), width=Cm(width_cm))
    caption(caption_text)
```

Nota: o `caption(...)` já existe no builder (Helvetica 10 bold, centralizado). Reuse-o.

---

### Task 1: Reestruturar Fundamentação e criar a seção Método

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Fundir a "posição crítica" na Introdução.** No 4º parágrafo da Introdução (o que começa "Alinhado a essa oportunidade..."), inserir ANTES dele um `body(...)` com: "Ferramentas usuais de gestão de projetos, como quadros de tarefas e painéis, registram o que foi feito, mas não capturam o porquê das decisões nem transformam observações em conhecimento compartilhado; o MPO endereça essa lacuna ao tratar a observação, e não apenas a execução, como objeto de primeira classe." (Se o §2 da Introdução já traz frase equivalente, ajustar para não duplicar.)

- [ ] **Step 2: Remover DSR da Fundamentação.** A seção 2 mantém apenas 2.1 Observatórios e MPO, 2.2 Gestão do conhecimento, 2.3 IA Generativa como assistente. Garantir que NÃO há subseção de DSR na seção 2 (a versão atual já não tem; confirmar).

- [ ] **Step 3: Substituir a seção "3. Método" atual por uma versão com duas subseções.** Trocar o bloco atual `heading("3. Método")` + `subheading("3.1. Design Science Research")` + único `body(...)` por:

```python
heading("3. Método")
subheading("3.1. Design Science Research")
body("A construção do ObiOne segue a Design Science Research, que estabelece o artefato "
     "como forma legítima de pesquisa (Hevner et al., 2004) e organiza o trabalho em "
     "atividades de identificação do problema, definição de objetivos, design e "
     "desenvolvimento, demonstração, avaliação e comunicação (Peffers et al., 2007). Por "
     "se tratar de uma pergunta de viabilidade, responder exige construir o sistema, "
     "colocá-lo em uso e observar o resultado, e não apenas coletar opiniões sobre uma "
     "descrição.", first=True)
subheading("3.2. Desenho da avaliação")
body("A avaliação combinou a demonstração de uso real do artefato com a medição da "
     "percepção de valor. A percepção foi medida por um instrumento de doze afirmações em "
     "escala Likert de 1 a 5 e três perguntas abertas, aplicado em duas rodadas de piloto "
     "com quatro consultores cada, após um walkthrough do sistema. A segunda rodada "
     "ocorreu depois da inclusão de um onboarding de primeiro acesso e reuniu um público "
     "mais diverso. Como as duas rodadas usaram participantes distintos, a comparação é "
     "exploratória e carrega um confundidor: a variação entre rodadas mistura o efeito das "
     "mudanças no produto com a diferença de composição das coortes. A avaliação foi "
     "conduzida na perspectiva do consultor, perfil central do observatório; a aplicação, "
     "porém, oferece telas para os três perfis — consultor, administrador e cliente — "
     "conforme o Apêndice C. Os resultados são reportados como casos, sem inferência "
     "estatística.", first=True)
```

- [ ] **Step 4: Regenerar e verificar.**

Run:
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
assert "Desenho da avaliação" in t, "faltou 3.2"
assert "confundidor" in t, "faltou confundidor"
assert "perspectiva do consultor" in t, "faltou perspectiva consultor"
print("OK task1")
PY
```
Expected: `OK task1`

- [ ] **Step 5: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Método como seção própria (DSR + desenho da avaliação)"
```

---

### Task 2: Seção "4. Implementação" — requisitos+Sommerville, arquitetura, IA

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Renomear a seção 4 e substituir 4.1/4.2.** Trocar `heading("4. Estudo de Caso")` por `heading("4. Implementação")`. Remover a subseção "4.1. Contexto, stakeholders e abordagem" (contexto migra para o Método/Estudo; manter só uma frase de contexto no início de 4.1). Reescrever 4.1 e 4.3 e inserir 4.2 nova:

```python
heading("4. Implementação")
subheading("4.1. Requisitos e rastreabilidade ao MPO")
body("O ObiOne foi desenvolvido para uma consultoria de marketing, que atua como "
     "organização executora e curadora, e seus clientes, que acessam cada um o próprio "
     "projeto. A elicitação e a especificação seguiram práticas usuais de engenharia de "
     "requisitos (Sommerville, 2016), e cada requisito funcional foi ancorado a uma "
     "característica ou processo do MPO, de modo que o artefato implementasse o modelo, e "
     "não apenas se inspirasse nele. A Tabela 1 apresenta uma amostra; a rastreabilidade "
     "completa está no Apêndice A.", first=True)
```

- [ ] **Step 2: Manter a Tabela 1 (amostra de rastreabilidade)** logo após 4.1 — reusar a `caption("Tabela 1. ...")` + `table(...)` já existentes. Ajustar a frase de cobertura para referir o Apêndice A. Manter as 5 linhas atuais.

- [ ] **Step 3: Inserir 4.2 Arquitetura (detalhada), substituindo a antiga "4.3. Arquitetura e ferramentas".**

```python
subheading("4.2. Arquitetura")
body("O ObiOne é uma aplicação web dividida em backend e frontend. O backend usa Java 21 "
     "e Spring Boot, com os módulos web, data-jpa, security e validation, e segue uma "
     "organização por contexto de domínio em camadas: controladores REST finos, serviços "
     "com a lógica de negócio, repositórios Spring Data, entidades JPA e objetos de "
     "transferência de dados com mapeadores dedicados. A persistência de desenvolvimento "
     "usa um banco H2 em arquivo, com PostgreSQL previsto para produção. O frontend usa "
     "React com TanStack Start e roteamento baseado em arquivos, construído com Vite; o "
     "estado de servidor é gerido por react-query e os formulários por react-hook-form com "
     "validação por esquema. A API responde sob o caminho base barra-api, e a aplicação "
     "adota um padrão de origem única: o servidor de desenvolvimento serve a interface e "
     "encaminha as chamadas de API ao backend, o que simplifica o acesso remoto para as "
     "sessões de validação.", first=True)
```

- [ ] **Step 4: Inserir 4.3 Camada de IA (detalhada), substituindo a antiga 4.4 (pipeline).**

```python
subheading("4.3. Camada de IA")
body("A IA é uma camada assistiva sobre o ciclo de observação, conversa e aprendizado, "
     "organizada em quatro papéis. A Observadora sugere observações ancoradas na gramática "
     "do MPO; a Sintetizadora consolida conversas em aprendizados reaproveitáveis; a "
     "Configuradora apoia o cadastro e a categorização de domínio; e a Consultora apoia a "
     "leitura do portfólio. A integração usa Spring AI, com o provedor selecionável por "
     "configuração: um modo determinístico, sem chave e voltado a testes, e o provedor da "
     "OpenAI para uso real. Cada sugestão é registrada com sua proveniência — provedor, "
     "modelo e instante — e com a indicação de aceite pelo consultor, o que torna o uso da "
     "IA auditável. Toda sugestão é apenas uma proposta: a decisão de publicar é sempre "
     "humana, em linha com o princípio human-in-the-loop (CHI, 2026; medRxiv, 2024).",
     first=True)
```

- [ ] **Step 5: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
for k in ["4. Implementação","Sommerville, 2016","4.2. Arquitetura","4.3. Camada de IA","Spring AI"]:
    assert k in t, f"faltou {k}"
print("OK task2")
PY
```
Expected: `OK task2`

- [ ] **Step 6: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Implementação com requisitos (Sommerville), arquitetura e camada de IA detalhadas"
```

---

### Task 3: Implementação — prototipação, governança, jornada/MVP

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Inserir 4.4 Prototipação.**
```python
subheading("4.4. Prototipação")
body("Antes do desenvolvimento final, as telas foram prototipadas com apoio de "
     "ferramentas de geração assistida por IA no ecossistema React, incluindo o Lovable, "
     "que produziu o scaffold inicial da interface e da sua configuração de build. A "
     "prototipação rápida corresponde à atividade de design e desenvolvimento da Design "
     "Science Research e serviu de insumo concreto para as validações com os "
     "orientadores, encurtando o ciclo entre uma ideia de tela e uma versão navegável.",
     first=True)
```

- [ ] **Step 2: Inserir 4.5 Governança por papel (detalhada).**
```python
subheading("4.5. Governança por papel")
body("O acesso ao observatório é semi-aberto e governado pelo papel do usuário. As "
     "leituras exigem autenticação; as mutações são restritas aos papéis de consultor e "
     "administrador, enquanto o cliente contribui nas conversas e enxerga apenas o seu "
     "próprio projeto. O consultor conduz a curadoria e vê todo o portfólio; o "
     "administrador acumula as permissões de gestão; o cliente participa da comunidade do "
     "seu caso sem acesso às ações de equipe nem à visão consolidada do portfólio. Esse "
     "arranjo garante o isolamento entre clientes e materializa, na prática, o acesso "
     "semi-aberto previsto no MPO. As telas correspondentes a cada perfil estão no "
     "Apêndice C.", first=True)
```

- [ ] **Step 3: Inserir 4.6 Jornada do usuário e construção do MVP.**
```python
subheading("4.6. Jornada do usuário e construção do MVP")
body("A jornada central percorre quatro momentos: o cadastro de um projeto assistido por "
     "um wizard com apoio de IA, o registro de observações ancoradas no MPO, a conversa da "
     "comunidade sobre essas observações e a consolidação de aprendizados reaproveitáveis. "
     "Um feed reflete a atividade recente e a cobertura de cada projeto frente ao MPO é "
     "consultável. O MVP foi construído em torno desse fluxo e entregou o cadastro com "
     "extração assistida, a organização da comunidade por domínio, o detalhe do projeto "
     "com os atributos do MPO, a consolidação de aprendizados com apoio da Sintetizadora, "
     "o feed de novidades e, após a primeira rodada de validação, um onboarding de "
     "primeiro acesso que apresenta o objetivo do sistema e o ciclo de conhecimento.",
     first=True)
```

- [ ] **Step 4: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
for k in ["4.4. Prototipação","Lovable","4.5. Governança por papel","4.6. Jornada do usuário","wizard"]:
    assert k in t, f"faltou {k}"
print("OK task3")
PY
```
Expected: `OK task3`

- [ ] **Step 5: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Implementação com prototipação (Lovable/React), governança e jornada/MVP"
```

---

### Task 4: Resultados — nota metodológica de perspectiva e telas

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Ajustar a abertura de 5.2.** No `body(...)` de "5.2. Percepção de valor", garantir que a primeira frase mencione a perspectiva de consultor e o Apêndice C. Trocar a frase inicial por: "A percepção de valor foi medida em duas rodadas de piloto com quatro consultores cada, na perspectiva do consultor; a aplicação, contudo, oferece telas para consultor, administrador e cliente (Apêndice C)." Manter o restante do parágrafo (números das duas rodadas) inalterado.

- [ ] **Step 2: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
assert "Apêndice C" in t and "administrador e cliente" in t, "faltou nota de perfis"
print("OK task4")
PY
```
Expected: `OK task4`

- [ ] **Step 3: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Resultados anota perspectiva de consultor e telas por perfil"
```

---

### Task 5: Discussão e Lições Aprendidas — expansão

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Inserir dois parágrafos de lições** logo após o parágrafo de decisões arquiteturais em "6. Discussões e Lições Aprendidas" (antes do parágrafo "Quanto aos aprendizados da equipe..."). Adicionar:

```python
body("A lição mais marcante foi de escopo. O projeto passou por um pivô: a proposta "
     "inicial foi reescopada para refinar o propósito da solução, deslocando o foco de um "
     "extrator de atributos para um observatório-comunidade. Esse refino exigiu bastante "
     "trabalho ao longo de várias validações com os orientadores, e foi ele, mais do que "
     "qualquer ganho de ferramenta, que destravou o valor percebido. A IA generativa "
     "acelerou a construção, mas mostrou um limite claro: sem uma definição nítida do que "
     "se está construindo, a velocidade da IA não leva a lugar nenhum; ela amplifica a "
     "direção que já existe, não a substitui.")
```

- [ ] **Step 2: Amarrar a expansão à jornada do MVP.** Ajustar o parágrafo de aprendizados de equipe para começar conectando com a jornada: prefixar "Amarradas a essa jornada, as lições de equipe se somam às de escopo: ...".

- [ ] **Step 3: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
for k in ["pivô","refinar o propósito","não leva a lugar nenhum","validações com os orientadores"]:
    assert k in t, f"faltou {k}"
print("OK task5")
PY
```
Expected: `OK task5`

- [ ] **Step 4: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): expande Lições Aprendidas (pivô, refino de escopo, limite da IA)"
```

---

### Task 6: Referências — adicionar Sommerville

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Adicionar a entrada na lista `refs`** (em ordem alfabética, após "Qualitative Coding..." e antes de "Vieira"), o item:
```python
'Sommerville, I. (2016) "Software Engineering", 10ª ed., Pearson Education, Boston.',
```

- [ ] **Step 2: Regenerar e verificar citação↔referência.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
assert "Sommerville, 2016" in t, "citação no corpo ausente"
assert 'Sommerville, I. (2016)' in t, "referência ausente"
# em dash é permitido apenas na afiliação (endereço, antes do Resumo); no corpo, zero
body_text = t.split("Resumo.", 1)[1] if "Resumo." in t else t
assert "—" not in body_text, "em dash no corpo (proibido)"
print("OK task6")
PY
```
Expected: `OK task6`

- [ ] **Step 3: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): adiciona referência Sommerville (2016)"
```

---

### Task 7: Apêndice A — Requisitos com rastreabilidade ao MPO + link do Git

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Adicionar os helpers `add_hyperlink`, `link_line`, `figure`** (bloco "Helpers a adicionar no builder" no topo deste plano), junto aos demais helpers.

- [ ] **Step 2: Reescrever o bloco de Apêndices.** Substituir o `heading("Apêndices")` atual + os `body(...)` de links por três apêndices. O Apêndice A:

```python
heading("Apêndices")
subheading("Apêndice A — Requisitos e rastreabilidade ao MPO")
body("A Tabela A.1 relaciona os principais requisitos funcionais do ObiOne às "
     "características e processos do MPO (Vieira, 2022) e à sua materialização no sistema. "
     "A especificação completa dos requisitos está no repositório.", first=True)
caption("Tabela A.1. Rastreabilidade dos requisitos funcionais ao MPO.")
table(
    ["RF", "Requisito", "Âncora no MPO (Vieira, 2022)", "Implementação"],
    [
        ["RF01", "Autenticar usuário", "Segurança (p. 192)", "auth por token; SecurityConfig"],
        ["RF02", "Perfis e acesso semi-aberto", "Acesso semi-aberto (p. 189); agentes (pp. 200-201)", "papéis consultor/admin/cliente"],
        ["RF03", "Cadastrar projeto (descrição textual)", "Coletar (p. 195)", "wizard de cadastro"],
        ["RF04", "Governança de visibilidade por papel", "Acesso semi-aberto (p. 189); Segurança (p. 192)", "enforcement por papel"],
        ["RF05", "Extrair atributos do MPO via IA", "Quadro 37 (p. 264); Transformar (p. 196)", "camada de IA (Observadora)"],
        ["RF06", "Persistir extração estruturada", "Armazenar (p. 196)", "entidades JPA"],
        ["RF07", "Portfólio perfil-aware", "Abrangência (p. 189); Disponibilizar (p. 196)", "listagem por papel"],
        ["RF08", "Detalhe do projeto", "Projetos (p. 186); Disponibilizar (p. 196)", "detalhe com atributos MPO"],
        ["RF09", "Cobertura do MPO", "Abrangência (p. 189); Avaliar (p. 198)", "GET /projects/{id}/coverage"],
        ["RF10", "Comentar/conversar no projeto", "Interatividade (p. 191); Interagir (p. 198)", "discussões da comunidade"],
        ["RF11", "Feed de novidades", "Acompanhar (p. 198)", "feed temporal in-app"],
        ["RF12", "Consolidar aprendizados (IA)", "Transformar; Categorizar (pp. 196-197)", "camada de IA (Sintetizadora)"],
        ["RF13", "Categorizar por temática/domínio", "Categorizar/Classificar (pp. 196-197)", "camada de IA (Configuradora)"],
    ])
link_line("Repositório", "https://github.com/raniel90/obione")
link_line("Especificação de requisitos", "https://github.com/raniel90/obione/blob/main/atividades/requisitos.md")
```

- [ ] **Step 3: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
d=Document("atividades/artigo/Artigo_ObiOne_SBC.docx")
t="\n".join(p.text for p in d.paragraphs)
assert "Apêndice A" in t and "RF13" in t, "tabela A incompleta"
assert len(d.tables) >= 3, f"esperado >=3 tabelas, achei {len(d.tables)}"
# hyperlink presente no XML
import zipfile, re
xml = zipfile.ZipFile("atividades/artigo/Artigo_ObiOne_SBC.docx").read("word/document.xml").decode()
assert "w:hyperlink" in xml, "hyperlink não inserido"
print("OK task7")
PY
```
Expected: `OK task7`

- [ ] **Step 4: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Apêndice A (rastreabilidade requisitos->MPO) + links do Git"
```

---

### Task 8: Apêndice B — Arquitetura + links

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Adicionar o Apêndice B** após o A:
```python
subheading("Apêndice B — Arquitetura do Observatório")
body("A arquitetura em camadas do backend (controladores, serviços, repositórios, "
     "entidades e mapeadores) e o pipeline da camada de IA estão descritos em detalhe nos "
     "documentos de arquitetura do repositório, listados a seguir.", first=True)
link_line("Arquitetura do backend", "https://github.com/raniel90/obione/blob/main/atividades/arquitetura_backend.md")
link_line("Pipeline da camada de IA", "https://github.com/raniel90/obione/blob/main/atividades/arquitetura_pipeline.md")
link_line("Diagrama da arquitetura", "https://github.com/raniel90/obione/blob/main/atividades/arquitetura_diagrama.md")
```

- [ ] **Step 2: Regenerar e verificar.**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
assert "Apêndice B" in t and "arquitetura_backend.md" in t
print("OK task8")
PY
```
Expected: `OK task8`

- [ ] **Step 3: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Apêndice B (arquitetura) + links dos docs"
```

---

### Task 9: Apêndice C — Telas por perfil (prints + tabela de visibilidade)

**Files:**
- Modify: `atividades/artigo/build_sbc_docx.py`

- [ ] **Step 1: Adicionar `from pathlib import Path` e a base dos prints** no topo do builder:
```python
from pathlib import Path
PRINTS = Path(HERE).parent / "apresentacoes" / "prints"
```
(HERE já é o dir do builder = `atividades/artigo`; `.parent` = `atividades`.)

- [ ] **Step 2: Adicionar o Apêndice C** com a tabela de visibilidade e as figuras (usar apenas prints existentes: `01-home.png`, `02-comunidade.png`, `03-detalhe-projeto.png`, `04-feed.png`, `05-consolidar-ia.png`, `06-wizard.png`):
```python
subheading("Apêndice C — Telas por perfil")
body("A Tabela C.1 resume quais perfis acessam cada tela; em seguida, as Figuras C.1 a "
     "C.6 ilustram as telas principais. O conjunto completo de telas está em "
     "Principais_Telas_ObiOne.pdf, no repositório.", first=True)
caption("Tabela C.1. Telas e perfis que as acessam.")
table(
    ["Tela", "Consultor", "Administrador", "Cliente"],
    [
        ["Observatório (home)", "sim", "sim", "visão limitada"],
        ["Comunidade", "sim", "sim", "sim (seu domínio)"],
        ["Detalhe do projeto", "sim (todos atributos)", "sim", "sim (seu projeto)"],
        ["Feed de novidades", "sim", "sim", "sim"],
        ["Consolidar com IA", "sim", "sim", "não"],
        ["Wizard de cadastro", "sim", "sim", "não"],
    ])
figure(PRINTS / "01-home.png", "Figura C.1. Observatório (home).")
figure(PRINTS / "02-comunidade.png", "Figura C.2. Comunidade.")
figure(PRINTS / "03-detalhe-projeto.png", "Figura C.3. Detalhe do projeto.")
figure(PRINTS / "04-feed.png", "Figura C.4. Feed de novidades.")
figure(PRINTS / "05-consolidar-ia.png", "Figura C.5. Consolidar aprendizado com IA.")
figure(PRINTS / "06-wizard.png", "Figura C.6. Wizard de cadastro de projeto.")
link_line("Telas completas", "https://github.com/raniel90/obione/blob/main/atividades/Principais_Telas_ObiOne.pdf")
```

- [ ] **Step 3: Regenerar e verificar (imagens embutidas).**
```bash
python3 atividades/artigo/build_sbc_docx.py
python3 - <<'PY'
from docx import Document
import zipfile
d=Document("atividades/artigo/Artigo_ObiOne_SBC.docx")
t="\n".join(p.text for p in d.paragraphs)
assert "Apêndice C" in t and "Figura C.6" in t
media=[n for n in zipfile.ZipFile("atividades/artigo/Artigo_ObiOne_SBC.docx").namelist() if n.startswith("word/media/")]
assert len(media) >= 6, f"esperado >=6 imagens, achei {len(media)}"
print("OK task9, imagens:", len(media))
PY
```
Expected: `OK task9, imagens: 6` (ou mais)

- [ ] **Step 4: Commit.**
```bash
git add atividades/artigo/build_sbc_docx.py
git commit -m "docs(artigo): Apêndice C (telas por perfil) com prints e tabela de visibilidade"
```

---

### Task 10: Sincronizar o markdown-espelho

**Files:**
- Modify: `atividades/artigo/artigo_obione.md`

- [ ] **Step 1: Reescrever `artigo_obione.md`** para espelhar a nova estrutura do docx: Introdução (com posição crítica fundida) · Fundamentação (2.1-2.3) · Método (3.1 DSR, 3.2 Desenho da avaliação) · Implementação (4.1 requisitos+Sommerville, 4.2 arquitetura, 4.3 IA, 4.4 prototipação, 4.5 governança, 4.6 jornada/MVP) · Resultados (com nota de perfis) · Discussão e Lições (expandida) · Conclusão + Questões em aberto · Referências (+ Sommerville) · Apêndices A (tabela + links), B (links), C (tabela de visibilidade + lista das figuras + link). Usar as MESMAS frases dos `body(...)` das tarefas 1-9 (copiar o texto para prosa Markdown; tabelas em GFM; figuras como itens de lista apontando aos prints).

- [ ] **Step 2: Verificar paridade de seções.**
```bash
grep -nE "^#{1,3} " atividades/artigo/artigo_obione.md
python3 - <<'PY'
md=open("atividades/artigo/artigo_obione.md").read()
for k in ["## 3. Método","### 3.2","## 4. Implementação","### 4.4","Sommerville","Apêndice A","Apêndice B","Apêndice C","pivô"]:
    assert k in md, f"faltou {k} no markdown"
print("OK task10")
PY
```
Expected: `OK task10`

- [ ] **Step 3: Commit.**
```bash
git add atividades/artigo/artigo_obione.md
git commit -m "docs(artigo): sincroniza markdown-espelho com a nova estrutura"
```

---

### Task 11: Gerar PDF, QC visual, copiar para o Desktop e finalizar

**Files:**
- Generate: `Artigo_ObiOne_SBC.pdf`; Copy: `~/Desktop/`

- [ ] **Step 1: Gerar o PDF.**
```bash
cd /Users/raniel/Documents/gitworkspace/phd/taes/obione
soffice --headless --convert-to pdf --outdir atividades/artigo atividades/artigo/Artigo_ObiOne_SBC.docx
pdfinfo atividades/artigo/Artigo_ObiOne_SBC.pdf | grep Pages
```
Expected: um número de páginas (provável 12-18).

- [ ] **Step 2: QC visual das seções novas.** Renderizar algumas páginas e conferir Método, Implementação e Apêndice C (telas):
```bash
pdftoppm -png -f 1 -l 1 -r 80 atividades/artigo/Artigo_ObiOne_SBC.pdf /tmp/qc_c1
# inspecionar visualmente /tmp/qc_c1-1.png e, se possível, as páginas dos apêndices
```
Confirmar: capa; Método com "Desenho da avaliação"; Implementação com 4.1-4.6; Apêndice A com Tabela A.1; Apêndice C com as 6 figuras renderizadas (não quebradas).

- [ ] **Step 3: Verificação final de qualidade.**
```bash
python3 - <<'PY'
from docx import Document
t="\n".join(p.text for p in Document("atividades/artigo/Artigo_ObiOne_SBC.docx").paragraphs)
body_text = t.split("Resumo.", 1)[1] if "Resumo." in t else t
assert "—" not in body_text, "em dash proibido no corpo"
for k in ["3.2. Desenho da avaliação","4. Implementação","4.4. Prototipação","4.5. Governança","4.6. Jornada",
          "Sommerville, 2016","Apêndice A","Apêndice B","Apêndice C","Questões em aberto"]:
    assert k in t, f"faltou {k}"
print("OK final")
PY
```
Expected: `OK final`

- [ ] **Step 4: Copiar para o Desktop.**
```bash
cp atividades/artigo/Artigo_ObiOne_SBC.pdf ~/Desktop/Artigo_ObiOne_SBC.pdf
cp atividades/artigo/Artigo_ObiOne_SBC.docx ~/Desktop/Artigo_ObiOne_SBC.docx
```

- [ ] **Step 5: Commit final (docx + pdf).**
```bash
git add atividades/artigo/Artigo_ObiOne_SBC.docx atividades/artigo/Artigo_ObiOne_SBC.pdf
git commit -m "docs(artigo): regenera docx e PDF enriquecidos (layout do professor)"
git push
```

---

## Self-Review (cobertura da spec)

- Layout do professor + renomes → Tasks 1-3 (Método próprio, Implementação). ✓
- Posição crítica → Introdução → Task 1. ✓
- Rastreabilidade req.→MPO na Implementação + Sommerville → Tasks 2, 6, 7. ✓
- Arquitetura detalhada → Task 2. ✓ · Camada de IA → Task 2. ✓ · Prototipação Lovable/React → Task 3. ✓ · Governança → Task 3. ✓ · Jornada/MVP/features → Task 3. ✓
- Testes na visão de consultor + telas 3 perfis → Task 4 (Resultados) + Task 9 (Apêndice C). ✓
- Lições (pivô, refino, IA sem definição clara, validações orientadores) → Task 5. ✓
- Apêndices A/B/C + link do Git → Tasks 7, 8, 9. ✓
- Sincronizar markdown → Task 10. ✓ · PDF + Desktop + commit no PR #89 → Task 11. ✓

Sem placeholders; nomes de helpers (`add_hyperlink`, `link_line`, `figure`, `caption`, `table`, `body`, `subheading`, `heading`) consistentes entre tarefas.
