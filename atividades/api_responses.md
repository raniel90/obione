# ObiOne — API Responses Report (com dados reais do Ollama)

> Gerado automaticamente em **2026-05-21 13:19** rodando o stack local
> (`make up`) contra `http://localhost:8000`.
> Provider LLM neste relatório: **`ollama/llama3.1:8b`** — todas as
> extrações, resumos e drafts foram gerados pelo modelo real (não mock).
> Latência observada: ~46-90s por chamada LLM.

Todos os endpoints abaixo foram exercidos ao vivo. Cada seção mostra
a **request real** (headers + body) e a **response real** (status +
body, com tokens redatados). Bodies muito longos (> 1500
chars) são truncados com indicação explícita.

## Sumário

| # | Bloco | Rotas |
|---|---|---|
| 1 | Health | `GET /health`, `GET /health/db` |
| 2 | Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/users` |
| 3 | Projects | CRUD + portfolio + add client |
| 4 | Documents | Upload `.docx` + list |
| 5 | Extractions | manual + from-document + coverage + evaluation |
| 6 | Comments | Top + reply + list + patch (US10) |
| 7 | Feed | `GET /feed` (US11) |
| 8 | Project detail | `GET /projects/{id}/detail` (US08) |
| 9 | Resumo do Cliente | generate → patch → publish (US12) |
| 10 | Drafts | generate batch → patch/delete → publish (US13) |
| 11 | Likert | consultoria + client + summary (US16, US17) |
| 12 | Casos de erro | 401, 403, 404, 422 |

---

## 1. Health
### GET /health

Liveness — não toca no banco.

**Request**

```http
GET /health HTTP/1.1
```

**Response** — `200 OK`

```json
{
  "status": "ok"
}
```

### GET /health/db

Readiness — executa `SELECT version()` no Postgres.

**Request**

```http
GET /health/db HTTP/1.1
```

**Response** — `200 OK`

```json
{
  "status": "ok",
  "postgres": "PostgreSQL 16.14 on aarch64-unknown-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit"
}
```

## 2. Auth
### POST /auth/login (admin)

Login com email + senha; retorna JWT (válido 24h).

**Request**

```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "admin@obione.dev",
  "password": "admin123"
}
```

**Response** — `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZGM5ZTY2OC1hZThjLTQyYjAtOTg4OC1lMGFlMDNhYjgzZDEiLCJpYXQiOjE3NzkzODAwNzQsImV4cCI6MTc3OTQ2NjQ3NCwicm9sZSI6ImFkbWluIn0.EWqhESQ9xK_XCnAxQYlAkhI4KDdT_XHOt95U24Qhpzo",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### GET /auth/me

Identidade do portador do JWT.

**Request**

```http
GET /auth/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...4Qhpzo
```

**Response** — `200 OK`

```json
{
  "id": "cdc9e668-ae8c-42b0-9888-e0ae03ab83d1",
  "email": "admin@obione.dev",
  "name": "Admin",
  "role": "admin",
  "created_at": "2026-05-20T17:13:02.963562Z"
}
```

### POST /auth/users (consultor)

Admin cria usuário com role `consultant`. Sem cadastro público.

**Request**

```http
POST /auth/users HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...4Qhpzo
Content-Type: application/json

{
  "email": "report-cons-1779390874@x.com",
  "password": "pwd12345678",
  "name": "Consultor Demo",
  "role": "consultant"
}
```

**Response** — `201 Created`

```json
{
  "id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "email": "report-cons-1779390874@x.com",
  "name": "Consultor Demo",
  "role": "consultant",
  "created_at": "2026-05-21T16:14:34.510615Z"
}
```

### POST /auth/users (cliente)

Admin cria usuário com role `client`.

**Request**

```http
POST /auth/users HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...4Qhpzo
Content-Type: application/json

{
  "email": "report-cli-1779390874@x.com",
  "password": "pwd12345678",
  "name": "Cliente Demo",
  "role": "client"
}
```

**Response** — `201 Created`

```json
{
  "id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11",
  "email": "report-cli-1779390874@x.com",
  "name": "Cliente Demo",
  "role": "client",
  "created_at": "2026-05-21T16:14:34.723604Z"
}
```

## 3. Projects
### GET /projects

Lista projetos visíveis. Consultor vê os seus; cliente vê só os atribuídos; admin vê tudo.

**Request**

```http
GET /projects HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[]
```

### POST /projects

Cria projeto. Domínios aceitos: legal, health, sports, branding, gastronomy, other.

**Request**

```http
POST /projects HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "name": "Demo API Report",
  "domain": "legal",
  "description": "projeto sintético para o relatório"
}
```

**Response** — `201 Created`

```json
{
  "id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "name": "Demo API Report",
  "domain": "legal",
  "description": "projeto sintético para o relatório",
  "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "created_at": "2026-05-21T16:14:35.174589Z",
  "updated_at": "2026-05-21T16:14:35.174593Z"
}
```

### GET /projects/{id}

Metadados do projeto sem dados derivados.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "name": "Demo API Report",
  "domain": "legal",
  "description": "projeto sintético para o relatório",
  "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "created_at": "2026-05-21T16:14:35.174589Z",
  "updated_at": "2026-05-21T16:14:35.174593Z"
}
```

### PATCH /projects/{id}

Atualização parcial — só os campos presentes no body são mexidos.

**Request**

```http
PATCH /projects/8e086056-c45c-46bc-9333-acb819b713b1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "description": "descrição atualizada via PATCH"
}
```

**Response** — `200 OK`

```json
{
  "id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "name": "Demo API Report",
  "domain": "legal",
  "description": "descrição atualizada via PATCH",
  "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "created_at": "2026-05-21T16:14:35.174589Z",
  "updated_at": "2026-05-21T16:14:35.194986Z"
}
```

### POST /projects/{id}/clients

Associa um usuário cliente ao projeto. Necessário para o cliente visualizar.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/clients HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "user_id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11"
}
```

**Response** — `201 Created`

```json
{
  "status": "added"
}
```

### GET /projects/portfolio

**US07** Visão de portfólio do consultor — status derivado + cobertura % por projeto. Cliente recebe 403.

**Request**

```http
GET /projects/portfolio HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "name": "Demo API Report",
    "domain": "legal",
    "description": "descrição atualizada via PATCH",
    "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "created_at": "2026-05-21T16:14:35.174589Z",
    "updated_at": "2026-05-21T16:14:35.194986Z",
    "status": "registered",
    "document_count": 0,
    "extraction_count": 0,
    "coverage_percentage": 0.0,
    "has_gabarito": false
  }
]
```

### GET /projects/portfolio?domain=legal

Mesma rota com filtro por domínio.

**Request**

```http
GET /projects/portfolio?domain=legal HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "name": "Demo API Report",
    "domain": "legal",
    "description": "descrição atualizada via PATCH",
    "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "created_at": "2026-05-21T16:14:35.174589Z",
    "updated_at": "2026-05-21T16:14:35.194986Z",
    "status": "registered",
    "document_count": 0,
    "extraction_count": 0,
    "coverage_percentage": 0.0,
    "has_gabarito": false
  }
]
```

## 4. Documents
### POST /projects/{id}/documents

**US04** Upload `.docx` (multipart/form-data). Backend valida MIME, tamanho (max `MAX_UPLOAD_SIZE_MB`) e calcula sha256. Rejeita duplicatas.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/documents HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: multipart/form-data; boundary=...

(arquivo .docx anexado como `file` — 5KB+)
```

**Response** — `201 Created`

```json
{
  "id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "original_name": "Valenca.docx",
  "sha256": "89fb8d9972b17482955b54011ff6125c63349feffb03037c7bb8f2d0de6296b0",
  "size_bytes": 8947,
  "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "uploaded_at": "2026-05-21T16:14:35.274072Z"
}
```

### GET /projects/{id}/documents

Lista documentos do projeto.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/documents HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "original_name": "Valenca.docx",
    "sha256": "89fb8d9972b17482955b54011ff6125c63349feffb03037c7bb8f2d0de6296b0",
    "size_bytes": 8947,
    "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "uploaded_at": "2026-05-21T16:14:35.274072Z"
  }
]
```

## 5. Extractions (MPO Quadro 37)
### POST /projects/{id}/extractions/manual (llm-style)

**US06 / US14** Persiste extração com `_meta.origem` arbitrário. Valida contra o JSON Schema (44 atributos). Aceita tanto LLM quanto gabarito_manual.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions/manual HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "content": {
    "_meta": {
      "projeto_nome": "demo",
      "documento_fonte": "Valenca.docx",
      "data_extracao": "2026-05-21T00:00:00Z",
      "origem": "llm"
    },
    "nome_projeto": "Demo API",
    "tipo": "consultoria jurídica",
    "porte": "pequeno",
    "escopo_planejado": "blindagem contratual",
    "status_cronograma": "atrasado",
    "riscos_identificados": "baixa adoção dos novos contratos pelos pacientes",
    "custo_estimado": 18000.0,
    "custo_realizado": 22000.0,
    "nome_stakeholders": [
      "Dra. Maria",
      "Consultor"
    ]
  }
}
```

**Response** — `201 Created`

```json
{
  "id": "2fc52807-6956-4afa-af31-4adfa82d45c5",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "document_id": null,
  "source": "manual",
  "llm_model": null,
  "content": {
    "_meta": {
      "projeto_nome": "demo",
      "documento_fonte": "Valenca.docx",
      "data_extracao": "2026-05-21T00:00:00Z",
      "origem": "llm"
    },
    "nome_projeto": "Demo API",
    "tipo": "consultoria jurídica",
    "porte": "pequeno",
    "escopo_planejado": "blindagem contratual",
    "status_cronograma": "atrasado",
    "riscos_identificados": "baixa adoção dos novos contratos pelos pacientes",
    "custo_estimado": 18000.0,
    "custo_realizado": 22000.0,
    "nome_stakeholders": [
      "Dra. Maria",
      "Consultor"
    ]
  },
  "created_at": "2026-05-21T16:14:35.325893Z"
}
```

### POST /projects/{id}/extractions/manual (gabarito)

Mesma rota; o `origem` em `_meta` distingue. É o caminho do **US14** para importar gabarito humano.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions/manual HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "content": {
    "_meta": {
      "projeto_nome": "demo",
      "documento_fonte": "Valenca.docx",
      "data_extracao": "2026-05-21T00:00:00Z",
      "origem": "gabarito_manual"
    },
    "nome_projeto": "Demo API",
    "tipo": "consultoria jurídica",
    "porte": "pequeno",
    "escopo_planejado": "blindagem contratual",
    "status_cronograma": "atrasado",
    "riscos_identificados": "adoção dos contratos",
    "custo_estimado": 18000.0,
    "nome_stakeholders": [
      "Dra. Maria"
    ]
  }
}
```

**Response** — `201 Created`

```json
{
  "id": "46338807-9ce7-4de5-93b5-cfbeada0eaa0",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "document_id": null,
  "source": "manual",
  "llm_model": null,
  "content": {
    "_meta": {
      "projeto_nome": "demo",
      "documento_fonte": "Valenca.docx",
      "data_extracao": "2026-05-21T00:00:00Z",
      "origem": "gabarito_manual"
    },
    "nome_projeto": "Demo API",
    "tipo": "consultoria jurídica",
    "porte": "pequeno",
    "escopo_planejado": "blindagem contratual",
    "status_cronograma": "atrasado",
    "riscos_identificados": "adoção dos contratos",
    "custo_estimado": 18000.0,
    "nome_stakeholders": [
      "Dra. Maria"
    ]
  },
  "created_at": "2026-05-21T16:14:35.336252Z"
}
```

### POST /projects/{id}/extractions/from-document/{doc_id}

**US05** Dispara extração via LLM no documento. Chamada real ao Ollama Llama 3.1 8B — ~50-80s de latência. Em CI/tests fica em mock.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions/from-document/cb2b01c6-250c-4514-ba7c-2cbda1465755 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `201 Created`

```json
{
  "id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "document_id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
  "source": "llm",
  "llm_model": "ollama/llama3.1:8b",
  "content": {
    "_meta": {
      "projeto_nome": "Demo API Report",
      "documento_fonte": "Valenca.docx",
      "hash_documento": null,
      "modelo_llm": "ollama/llama3.1:8b",
      "data_extracao": "2026-05-21T16:16:31.893958+00:00",
      "origem": "llm"
    },
    "nome_projeto": "Revisão contratual e termos de consentimento odontológico",
    "descricao": "Construir contrato de tratamento, incluir cláusulas protetivas e de imagem, criar termos de consentimento.",
    "local_execucao": null,
    "tipo": "Jurídico + Compliance documental + Proteção contratual",
    "porte": "pequeno",
    "objetivos": "blindar juridicamente o consultório com documentos mais sólidos para tratamentos e casos cirúrgicos.",
    "descricao_produtos_servicos": null,
    "licitacao": null,
    "contratos": null,
    "termo_encerramento": null,
    "justificativas_projeto": "fragilidade contratual e risco jurídico em relação a procedimentos ortodônticos.",
    "impactos_projeto": "curto/longo prazo",
    "indicadores_projeto": "redução de risco contratual, padronização de consentimento, melhor segurança operacional",
    "artefatos_produzidos": "contrato 1º versão, termo geral e termo específico de ortodontia.",
    "imagens_fotos": null,
    "nome_stakeholders": null,
    "f

... (+1302 chars truncados)
```

### GET /projects/{id}/extractions

Lista todas as extrações do projeto ordenadas por data desc.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "document_id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
    "source": "llm",
    "llm_model": "ollama/llama3.1:8b",
    "content": {
      "tipo": "Jurídico + Compliance documental + Proteção contratual",
      "_meta": {
        "origem": "llm",
        "modelo_llm": "ollama/llama3.1:8b",
        "projeto_nome": "Demo API Report",
        "data_extracao": "2026-05-21T16:16:31.893958+00:00",
        "hash_documento": null,
        "documento_fonte": "Valenca.docx"
      },
      "porte": "pequeno",
      "contratos": null,
      "descricao": "Construir contrato de tratamento, incluir cláusulas protetivas e de imagem, criar termos de consentimento.",
      "licitacao": null,
      "objetivos": "blindar juridicamente o consultório com documentos mais sólidos para tratamentos e casos cirúrgicos.",
      "requisitos": "clareza, concisão e proteção jurídica",
      "data_inicio": "2026-01-01",
      "nome_projeto": "Revisão contratual e termos de consentimento odontológico",
      "publico_alvo": null,
      "imagens_fotos": null,
      "pontos_fortes": "foco em cláusulas realmente úteis",
      "pontos_fracos": "risco inicial de contrato ficar extenso demais",
      "custo_estimado": 800.0,
      "funcao_projeto": null,
      "local_execucao": null,
      "custo_realizado": null,
      "detalhes_equipe": "advogado, cliente, documentação clínica",
      "tarefas_pro

... (+3059 chars truncados)
```

### GET /projects/{id}/extractions/coverage

**US09** Cobertura do MPO sobre a extração mais recente. `imagens_fotos` é fora-de-escopo.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions/coverage HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "filled": 20,
  "total_in_scope": 43,
  "out_of_scope_count": 1,
  "percentage": 46.51,
  "by_category": [
    {
      "category": "conteudo_geral",
      "filled": 9,
      "total_in_scope": 14,
      "percentage": 64.29
    },
    {
      "category": "stakeholders",
      "filled": 1,
      "total_in_scope": 5,
      "percentage": 20.0
    },
    {
      "category": "escopo",
      "filled": 1,
      "total_in_scope": 4,
      "percentage": 25.0
    },
    {
      "category": "cronograma",
      "filled": 4,
      "total_in_scope": 5,
      "percentage": 80.0
    },
    {
      "category": "custos",
      "filled": 1,
      "total_in_scope": 3,
      "percentage": 33.33
    },
    {
      "category": "riscos",
      "filled": 0,
      "total_in_scope": 5,
      "percentage": 0.0
    },
    {
      "category": "mudancas",
      "filled": 0,
      "total_in_scope": 3,
      "percentage": 0.0
    },
    {
      "category": "licoes_aprendidas",
      "filled": 4,
      "total_in_scope": 4,
      "percentage": 100.0
    }
  ]
}
```

### GET /projects/{id}/extractions/evaluation

**US15** Compara última extração `llm` vs último `gabarito_manual`. TP/FP/FN/precision/recall/F1 sobre atributos `estruturado`. `texto_livre` marcado `needs_human_review` para a rubrica Sprint 5.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/extractions/evaluation HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "per_attribute": [
    {
      "name": "nome_projeto",
      "category": "conteudo_geral",
      "extraction_type": "estruturado",
      "verdict": "fn",
      "llm_value": "Revisão contratual e termos de consentimento odontológico",
      "gabarito_value": "Demo API"
    },
    {
      "name": "descricao",
      "category": "conteudo_geral",
      "extraction_type": "texto_livre",
      "verdict": "needs_human_review",
      "llm_value": "Construir contrato de tratamento, incluir cláusulas protetivas e de imagem, criar termos de consentimento.",
      "gabarito_value": null
    },
    {
      "name": "local_execucao",
      "category": "conteudo_geral",
      "extraction_type": "estruturado",
      "verdict": "tn",
      "llm_value": null,
      "gabarito_value": null
    },
    {
      "name": "tipo",
      "category": "conteudo_geral",
      "extraction_type": "estruturado",
      "verdict": "fn",
      "llm_value": "Jurídico + Compliance documental + Proteção contratual",
      "gabarito_value": "consultoria jurídica"
    },
    {
      "name": "porte",
      "category": "conteudo_geral",
      "extraction_type": "estruturado",
      "verdict": "tp",
      "llm_value": "pequeno",
      "gabarito_value": "pequeno"
    },
    {
      "name": "objetivos",
      "category": "conteudo_geral",
      "extraction_type": "texto_livre",
      "verdict": "needs_human_review",
      "llm_value": "blindar juridicamente o consultório com documentos mais sólidos para tratamentos e c

... (+8933 chars truncados)
```

## 6. Comments (US10)
### POST /projects/{id}/comments

Comentário top-level. Visível para consultor + cliente do projeto.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/comments HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "body": "Quando vamos discutir os próximos passos?"
}
```

**Response** — `201 Created`

```json
{
  "id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "author_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "parent_id": null,
  "body": "Quando vamos discutir os próximos passos?",
  "created_at": "2026-05-21T16:16:32.359844Z",
  "updated_at": "2026-05-21T16:16:32.359850Z"
}
```

### POST /projects/{id}/comments (reply)

Resposta a comentário existente. Threading limitado a 1 nível.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/comments HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "body": "Combinar reunião com Bruno na quinta.",
  "parent_id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88"
}
```

**Response** — `201 Created`

```json
{
  "id": "713cbf3a-d73c-473b-b88a-9bde9b10be6c",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "author_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "parent_id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
  "body": "Combinar reunião com Bruno na quinta.",
  "created_at": "2026-05-21T16:16:32.374970Z",
  "updated_at": "2026-05-21T16:16:32.374975Z"
}
```

### GET /projects/{id}/comments

Lista comentários do projeto em ordem cronológica ascendente.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/comments HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "author_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "parent_id": null,
    "body": "Quando vamos discutir os próximos passos?",
    "created_at": "2026-05-21T16:16:32.359844Z",
    "updated_at": "2026-05-21T16:16:32.359850Z"
  },
  {
    "id": "713cbf3a-d73c-473b-b88a-9bde9b10be6c",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "author_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "parent_id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
    "body": "Combinar reunião com Bruno na quinta.",
    "created_at": "2026-05-21T16:16:32.374970Z",
    "updated_at": "2026-05-21T16:16:32.374975Z"
  }
]
```

### PATCH /comments/{id}

Apenas o autor pode editar o próprio comentário.

**Request**

```http
PATCH /comments/119bdb10-58ed-4c21-ab0a-21dc0f395e88 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "body": "Editado via PATCH para fins do relatório."
}
```

**Response** — `200 OK`

```json
{
  "id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "author_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "parent_id": null,
  "body": "Editado via PATCH para fins do relatório.",
  "created_at": "2026-05-21T16:16:32.359844Z",
  "updated_at": "2026-05-21T16:16:32.388877Z"
}
```

## 7. Feed (US11)
### GET /feed?limit=N

Merge cronológico de eventos (`new_comment`, `new_extraction`, `new_document`) dos projetos visíveis ao usuário. Default limit 50, max 200.

**Request**

```http
GET /feed?limit=10 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "events": [
    {
      "kind": "new_comment",
      "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
      "project_name": "Demo API Report",
      "actor_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
      "target_id": "713cbf3a-d73c-473b-b88a-9bde9b10be6c",
      "created_at": "2026-05-21T16:16:32.374970Z",
      "summary": "Combinar reunião com Bruno na quinta."
    },
    {
      "kind": "new_comment",
      "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
      "project_name": "Demo API Report",
      "actor_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
      "target_id": "119bdb10-58ed-4c21-ab0a-21dc0f395e88",
      "created_at": "2026-05-21T16:16:32.359844Z",
      "summary": "Editado via PATCH para fins do relatório."
    },
    {
      "kind": "new_extraction",
      "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
      "project_name": "Demo API Report",
      "actor_id": null,
      "target_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
      "created_at": "2026-05-21T16:16:32.020760Z",
      "summary": "Nova extração via ollama/llama3.1:8b"
    },
    {
      "kind": "new_extraction",
      "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
      "project_name": "Demo API Report",
      "actor_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
      "target_id": "46338807-9ce7-4de5-93b5-cfbeada0eaa0",
      "created_at": "2026-05-21T16:14:35.336252Z",
      "summary": "Nova extração (entrada manual)"
    },
    {
      "kind": "new_extraction",
      

... (+687 chars truncados)
```

## 8. Project detail (US08)
### GET /projects/{id}/detail

**US08** View-shaped consolidated payload — project + documents + latest llm + latest gabarito + coverage + evaluation + recent comments + counts.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/detail HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "project": {
    "id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "name": "Demo API Report",
    "domain": "legal",
    "description": "descrição atualizada via PATCH",
    "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "created_at": "2026-05-21T16:14:35.174589Z",
    "updated_at": "2026-05-21T16:14:35.194986Z"
  },
  "documents": [
    {
      "id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
      "original_name": "Valenca.docx",
      "sha256": "89fb8d9972b17482955b54011ff6125c63349feffb03037c7bb8f2d0de6296b0",
      "size_bytes": 8947,
      "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "uploaded_at": "2026-05-21T16:14:35.274072Z"
    }
  ],
  "latest_llm_extraction": {
    "id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "source": "llm",
    "llm_model": "ollama/llama3.1:8b",
    "created_at": "2026-05-21T16:16:32.020760Z"
  },
  "latest_gabarito": {
    "id": "46338807-9ce7-4de5-93b5-cfbeada0eaa0",
    "source": "manual",
    "llm_model": null,
    "created_at": "2026-05-21T16:14:35.336252Z"
  },
  "coverage": {
    "extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "filled": 20,
    "total_in_scope": 43,
    "out_of_scope_count": 1,
    "percentage": 46.51
  },
  "evaluation": {
    "tp": 1,
    "fp": 2,
    "fn": 5,
    "tn": 7,
    "precision": 0.3333,
    "recall": 0.1667,
    "f1": 0.2222,
    "needs_human_review_count": 28
  },
  "recent_comments": [
    {
      "id": "713cbf3a-d73c-473b-b88

... (+588 chars truncados)
```

### GET /projects/{id}/detail?comments_limit=N

Slice de comentários customizável (max 100). `0` retorna lista vazia mas mantém `counts.comments`.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/detail?comments_limit=2 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "project": {
    "id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "name": "Demo API Report",
    "domain": "legal",
    "description": "descrição atualizada via PATCH",
    "consultant_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "created_at": "2026-05-21T16:14:35.174589Z",
    "updated_at": "2026-05-21T16:14:35.194986Z"
  },
  "documents": [
    {
      "id": "cb2b01c6-250c-4514-ba7c-2cbda1465755",
      "original_name": "Valenca.docx",
      "sha256": "89fb8d9972b17482955b54011ff6125c63349feffb03037c7bb8f2d0de6296b0",
      "size_bytes": 8947,
      "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "uploaded_at": "2026-05-21T16:14:35.274072Z"
    }
  ],
  "latest_llm_extraction": {
    "id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "source": "llm",
    "llm_model": "ollama/llama3.1:8b",
    "created_at": "2026-05-21T16:16:32.020760Z"
  },
  "latest_gabarito": {
    "id": "46338807-9ce7-4de5-93b5-cfbeada0eaa0",
    "source": "manual",
    "llm_model": null,
    "created_at": "2026-05-21T16:14:35.336252Z"
  },
  "coverage": {
    "extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "filled": 20,
    "total_in_scope": 43,
    "out_of_scope_count": 1,
    "percentage": 46.51
  },
  "evaluation": {
    "tp": 1,
    "fp": 2,
    "fn": 5,
    "tn": 7,
    "precision": 0.3333,
    "recall": 0.1667,
    "f1": 0.2222,
    "needs_human_review_count": 28
  },
  "recent_comments": [
    {
      "id": "713cbf3a-d73c-473b-b88

... (+588 chars truncados)
```

## 9. Resumo do Cliente (US12)
### POST /projects/{id}/resumos/generate

**US12** Gera resumo em status `draft` a partir da extração mais recente. Chamada real ao Ollama — gera narrativa PT-BR em Markdown.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/resumos/generate HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `201 Created`

```json
{
  "id": "c511c640-3360-40fa-b2da-012019c62579",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "body": "**Demo API Report**\n\n**Objetivos**\nO objetivo principal deste projeto é blindar juridicamente o consultório com documentos mais sólidos para tratamentos e casos cirúrgicos, garantindo clareza, concisão e proteção jurídica.\n\n**Escopo Planejado**\nO escopo planejado inclui a construção de contrato de tratamento, inclusão de cláusulas protetivas e de imagem, criação de termos de consentimento e revisão contratual. O foco é em cláusulas realmente úteis.\n\n**Status**\nO status atual do projeto é concluído, com data prevista para término em 01/04/2026.\n\n**Custos**\nO custo estimado para este projeto é de R$800,00.\n\n**Riscos Relevantes**\nUm dos principais riscos identificados é o risco inicial de contrato ficar extenso demais. Além disso, a fragilidade contratual e o risco jurídico em relação a procedimentos ortodônticos também são considerados relevantes.\n\n**Entregas Realizadas**\nAs entregas realizadas incluem o contrato final seguro, claro e mais objetivo, bem como os termos de consentimento.",
  "status": "draft",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-05-21T16:18:12.800665Z",
  "updated_at": "2026-05-21T16:18:12.800745Z"
}
```

### GET /projects/{id}/resumos (consultor)

Consultor vê todos os resumos (draft + published).

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/resumos HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "c511c640-3360-40fa-b2da-012019c62579",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "body": "**Demo API Report**\n\n**Objetivos**\nO objetivo principal deste projeto é blindar juridicamente o consultório com documentos mais sólidos para tratamentos e casos cirúrgicos, garantindo clareza, concisão e proteção jurídica.\n\n**Escopo Planejado**\nO escopo planejado inclui a construção de contrato de tratamento, inclusão de cláusulas protetivas e de imagem, criação de termos de consentimento e revisão contratual. O foco é em cláusulas realmente úteis.\n\n**Status**\nO status atual do projeto é concluído, com data prevista para término em 01/04/2026.\n\n**Custos**\nO custo estimado para este projeto é de R$800,00.\n\n**Riscos Relevantes**\nUm dos principais riscos identificados é o risco inicial de contrato ficar extenso demais. Além disso, a fragilidade contratual e o risco jurídico em relação a procedimentos ortodônticos também são considerados relevantes.\n\n**Entregas Realizadas**\nAs entregas realizadas incluem o contrato final seguro, claro e mais objetivo, bem como os termos de consentimento.",
    "status": "draft",
    "llm_model": "ollama/llama3.1:8b",
    "generated_by": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-05-21T16:18:12.800665Z",
    "updated_at": "2026-05-21T16:18:12.800745Z"
  }
]
```

### GET /projects/{id}/resumos (cliente)

Cliente só vê resumos `published`. Drafts são invisíveis.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/resumos HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...TAin6w
Content-Type: application/json
```

**Response** — `200 OK`

```json
[]
```

### GET /resumos/{id}

Consulta um resumo específico. Cliente recebe 404 em draft.

**Request**

```http
GET /resumos/c511c640-3360-40fa-b2da-012019c62579 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "id": "c511c640-3360-40fa-b2da-012019c62579",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "body": "**Demo API Report**\n\n**Objetivos**\nO objetivo principal deste projeto é blindar juridicamente o consultório com documentos mais sólidos para tratamentos e casos cirúrgicos, garantindo clareza, concisão e proteção jurídica.\n\n**Escopo Planejado**\nO escopo planejado inclui a construção de contrato de tratamento, inclusão de cláusulas protetivas e de imagem, criação de termos de consentimento e revisão contratual. O foco é em cláusulas realmente úteis.\n\n**Status**\nO status atual do projeto é concluído, com data prevista para término em 01/04/2026.\n\n**Custos**\nO custo estimado para este projeto é de R$800,00.\n\n**Riscos Relevantes**\nUm dos principais riscos identificados é o risco inicial de contrato ficar extenso demais. Além disso, a fragilidade contratual e o risco jurídico em relação a procedimentos ortodônticos também são considerados relevantes.\n\n**Entregas Realizadas**\nAs entregas realizadas incluem o contrato final seguro, claro e mais objetivo, bem como os termos de consentimento.",
  "status": "draft",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-05-21T16:18:12.800665Z",
  "updated_at": "2026-05-21T16:18:12.800745Z"
}
```

### PATCH /resumos/{id}

Edita o body enquanto draft. Após publish vira 409.

**Request**

```http
PATCH /resumos/c511c640-3360-40fa-b2da-012019c62579 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "body": "**Resumo revisado.**\n\nO consultor editou o draft antes de publicar."
}
```

**Response** — `200 OK`

```json
{
  "id": "c511c640-3360-40fa-b2da-012019c62579",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "body": "**Resumo revisado.**\n\nO consultor editou o draft antes de publicar.",
  "status": "draft",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-05-21T16:18:12.800665Z",
  "updated_at": "2026-05-21T16:18:13.985211Z"
}
```

### POST /resumos/{id}/publish

Publica o resumo. Irreversível. Stampa `reviewed_by` + `reviewed_at`. Cliente passa a ver.

**Request**

```http
POST /resumos/c511c640-3360-40fa-b2da-012019c62579/publish HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "id": "c511c640-3360-40fa-b2da-012019c62579",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "body": "**Resumo revisado.**\n\nO consultor editou o draft antes de publicar.",
  "status": "published",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "reviewed_at": "2026-05-21T16:18:14.007482Z",
  "created_at": "2026-05-21T16:18:12.800665Z",
  "updated_at": "2026-05-21T16:18:14.007482Z"
}
```

## 10. Drafts — Próximos Passos / Pontos de Atenção (US13)
### POST /projects/{id}/drafts/generate

**US13** Gera batch de N drafts (`kind ∈ {next_step, attention_point}`). Chamada real ao Ollama — gera próximos passos e pontos de atenção em JSON.

**Request**

```http
POST /projects/8e086056-c45c-46bc-9333-acb819b713b1/drafts/generate HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `201 Created`

```json
[
  {
    "id": "2a17eb4b-b883-4165-9d67-992d79676da7",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "next_step",
    "title": "Definir público-alvo e imagens/fotos para o projeto",
    "body": "Identificar os principais grupos de pacientes que serão atendidos e coletar imagens/fotos relevantes para o contrato.",
    "status": "draft",
    "llm_model": "ollama/llama3.1:8b",
    "generated_by": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-05-21T16:19:46.691456Z",
    "updated_at": "2026-05-21T16:19:46.691484Z"
  },
  {
    "id": "422507bd-09cd-401d-a204-19e0144ad8d8",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "attention_point",
    "title": "Risco de contrato extenso demais",
    "body": "O projeto identificou o risco inicial de o contrato ficar extenso demais, é importante equilibrar a proteção jurídica com a clareza e concisão.",
    "status": "draft",
    "llm_model": "ollama/llama3.1:8b",
    "generated_by": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-05-21T16:19:46.691497Z",
    "updated_at": "2026-05-21T16:19:46.691497Z"
  },
  {
    "id": "a297c59c-e419-458a-943b-026f0ca7b37f",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "

... (+3723 chars truncados)
```

### GET /projects/{id}/drafts (consultor)

Consultor vê todos. Cliente só os published.

**Request**

```http
GET /projects/8e086056-c45c-46bc-9333-acb819b713b1/drafts HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "4f2a08c6-a445-43fc-894e-2facb7d3797d",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "attention_point",
    "title": "Padronização de consentimento",
    "body": "O projeto identificou a padronização de consentimento como um dos principais indicadores do projeto, é importante monitorar essa métrica ao longo do tempo.",
    "status": "draft",
    "llm_model": "ollama/llama3.1:8b",
    "generated_by": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-05-21T16:19:46.691506Z",
    "updated_at": "2026-05-21T16:19:46.691506Z"
  },
  {
    "id": "46786a95-f184-4081-a12a-cd54ce3c1c80",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "next_step",
    "title": "Revisar o contrato final seguro e claro",
    "body": "Revisar o contrato final para garantir que ele seja seguro, claro e objetivo.",
    "status": "draft",
    "llm_model": "ollama/llama3.1:8b",
    "generated_by": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2026-05-21T16:19:46.691504Z",
    "updated_at": "2026-05-21T16:19:46.691505Z"
  },
  {
    "id": "d1e74f53-66e0-4bbe-bffe-f1e197fa3a9f",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
    "kind": "attention_point",
    "title": "Necessidade

... (+3723 chars truncados)
```

### GET /drafts/{id}

Consulta draft individual.

**Request**

```http
GET /drafts/2a17eb4b-b883-4165-9d67-992d79676da7 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "id": "2a17eb4b-b883-4165-9d67-992d79676da7",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "kind": "next_step",
  "title": "Definir público-alvo e imagens/fotos para o projeto",
  "body": "Identificar os principais grupos de pacientes que serão atendidos e coletar imagens/fotos relevantes para o contrato.",
  "status": "draft",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-05-21T16:19:46.691456Z",
  "updated_at": "2026-05-21T16:19:46.691484Z"
}
```

### PATCH /drafts/{id}

Edita título ou body enquanto draft. Após publish vira 409.

**Request**

```http
PATCH /drafts/2a17eb4b-b883-4165-9d67-992d79676da7 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "title": "Próximo passo (revisado)",
  "body": "Texto editado pelo consultor."
}
```

**Response** — `200 OK`

```json
{
  "id": "2a17eb4b-b883-4165-9d67-992d79676da7",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "kind": "next_step",
  "title": "Próximo passo (revisado)",
  "body": "Texto editado pelo consultor.",
  "status": "draft",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-05-21T16:19:46.691456Z",
  "updated_at": "2026-05-21T16:19:47.056431Z"
}
```

### DELETE /drafts/{id}

Descarta um draft enquanto ainda não publicado. Após publish vira 409.

**Request**

```http
DELETE /drafts/422507bd-09cd-401d-a204-19e0144ad8d8 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `204 No Content`

```json

```

### POST /drafts/{id}/publish

Publica o draft. Irreversível. Stampa reviewer. Cliente passa a ver esse item.

**Request**

```http
POST /drafts/2a17eb4b-b883-4165-9d67-992d79676da7/publish HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "id": "2a17eb4b-b883-4165-9d67-992d79676da7",
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "source_extraction_id": "8d67006e-e179-40fe-a297-2b192deecd5a",
  "kind": "next_step",
  "title": "Próximo passo (revisado)",
  "body": "Texto editado pelo consultor.",
  "status": "published",
  "llm_model": "ollama/llama3.1:8b",
  "generated_by": null,
  "reviewed_by": "8dd3025c-65ad-4907-94c9-393508fd9e33",
  "reviewed_at": "2026-05-21T16:19:47.085569Z",
  "created_at": "2026-05-21T16:19:46.691456Z",
  "updated_at": "2026-05-21T16:19:47.085569Z"
}
```

## 11. Likert feedback (US16 + US17)
### POST /likert/consultoria

**US16** Consultor/admin envia avaliação Likert 1-5 sobre as 4 dimensões da consultoria.

**Request**

```http
POST /likert/consultoria HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "utilidade_drafts": 5,
  "reducao_friccao": 4,
  "qualidade_resumo": 5,
  "manutenibilidade_mediador": 4
}
```

**Response** — `201 Created`

```json
[
  {
    "id": "4203ed43-bf75-4131-ac05-e2787ba04c9c",
    "kind": "consultoria",
    "dimension": "utilidade_drafts",
    "score": 5,
    "respondent_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:19:47.101395Z"
  },
  {
    "id": "b93b4adf-1d8a-4b22-9302-54bb4da3b0fb",
    "kind": "consultoria",
    "dimension": "reducao_friccao",
    "score": 4,
    "respondent_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:19:47.101406Z"
  },
  {
    "id": "14924eed-9091-4bd0-b7d4-2dfdc7009a0a",
    "kind": "consultoria",
    "dimension": "qualidade_resumo",
    "score": 5,
    "respondent_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:19:47.101408Z"
  },
  {
    "id": "6338f546-9b75-491c-a782-468b8a1c3c25",
    "kind": "consultoria",
    "dimension": "manutenibilidade_mediador",
    "score": 4,
    "respondent_id": "8dd3025c-65ad-4907-94c9-393508fd9e33",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:19:47.101410Z"
  }
]
```

### POST /likert/client

**US17** Cliente envia Likert sobre um projeto específico. Visibilidade ligada ao projeto (cliente não-assinado → 404).

**Request**

```http
POST /likert/client HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...TAin6w
Content-Type: application/json

{
  "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
  "clareza_resumo": 5,
  "utilidade_espaco": 5,
  "qualidade_dialogo": 4,
  "sentido_inclusao": 5
}
```

**Response** — `201 Created`

```json
[
  {
    "id": "fc523c2c-1276-4de5-a62c-da9fb09f9fc5",
    "kind": "client",
    "dimension": "clareza_resumo",
    "score": 5,
    "respondent_id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "comments": null,
    "created_at": "2026-05-21T16:19:47.131875Z"
  },
  {
    "id": "12a2ff58-da5f-4ff7-8b0f-f09d6d87c809",
    "kind": "client",
    "dimension": "utilidade_espaco",
    "score": 5,
    "respondent_id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "comments": null,
    "created_at": "2026-05-21T16:19:47.131882Z"
  },
  {
    "id": "6e3c8312-f056-4d21-9b79-2fef5d947335",
    "kind": "client",
    "dimension": "qualidade_dialogo",
    "score": 4,
    "respondent_id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "comments": null,
    "created_at": "2026-05-21T16:19:47.131883Z"
  },
  {
    "id": "1e6be523-5363-4d1c-b8c9-2aaffd0fe502",
    "kind": "client",
    "dimension": "sentido_inclusao",
    "score": 5,
    "respondent_id": "d87abdef-e1af-4faf-af9b-f6750ddf5e11",
    "project_id": "8e086056-c45c-46bc-9333-acb819b713b1",
    "comments": null,
    "created_at": "2026-05-21T16:19:47.131885Z"
  }
]
```

### GET /likert/responses?kind=…

Lista linhas brutas. Restrito a consultor/admin.

**Request**

```http
GET /likert/responses?kind=consultoria HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
[
  {
    "id": "68348644-f7e3-4377-869e-ef9facb101a4",
    "kind": "consultoria",
    "dimension": "utilidade_drafts",
    "score": 5,
    "respondent_id": "bce8a4d9-24d8-4cdb-ad31-0b81a4989ce1",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:07:46.807232Z"
  },
  {
    "id": "e8f10c28-dda3-47dc-9fb8-72b96e14fff6",
    "kind": "consultoria",
    "dimension": "reducao_friccao",
    "score": 4,
    "respondent_id": "bce8a4d9-24d8-4cdb-ad31-0b81a4989ce1",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:07:46.807235Z"
  },
  {
    "id": "41bdafd3-14aa-4568-997b-2b09f4d501bf",
    "kind": "consultoria",
    "dimension": "qualidade_resumo",
    "score": 5,
    "respondent_id": "bce8a4d9-24d8-4cdb-ad31-0b81a4989ce1",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:07:46.807236Z"
  },
  {
    "id": "e3383016-f34d-4d0d-badd-53119ad14f38",
    "kind": "consultoria",
    "dimension": "manutenibilidade_mediador",
    "score": 4,
    "respondent_id": "bce8a4d9-24d8-4cdb-ad31-0b81a4989ce1",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:07:46.807237Z"
  },
  {
    "id": "a87f474b-d60e-4ba7-bcbe-dca396f150f2",
    "kind": "consultoria",
    "dimension": "utilidade_drafts",
    "score": 5,
    "respondent_id": "6be67c64-3196-4c45-ad37-5230d4e0b81b",
    "project_id": null,
    "comments": null,
    "created_at": "2026-05-21T16:13:27.229184Z"
  },
  {
    "id": "4a562

... (+2054 chars truncados)
```

### GET /likert/summary?kind=consultoria

Agregado por dimensão (count/mean/min/max + respondent_count).

**Request**

```http
GET /likert/summary?kind=consultoria HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "kind": "consultoria",
  "respondent_count": 3,
  "by_dimension": [
    {
      "dimension": "utilidade_drafts",
      "count": 3,
      "mean": 5.0,
      "min": 5,
      "max": 5
    },
    {
      "dimension": "reducao_friccao",
      "count": 3,
      "mean": 4.0,
      "min": 4,
      "max": 4
    },
    {
      "dimension": "qualidade_resumo",
      "count": 3,
      "mean": 5.0,
      "min": 5,
      "max": 5
    },
    {
      "dimension": "manutenibilidade_mediador",
      "count": 3,
      "mean": 4.0,
      "min": 4,
      "max": 4
    }
  ]
}
```

### GET /likert/summary?kind=client

Mesma rota com `kind=client`.

**Request**

```http
GET /likert/summary?kind=client HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `200 OK`

```json
{
  "kind": "client",
  "respondent_count": 1,
  "by_dimension": [
    {
      "dimension": "clareza_resumo",
      "count": 1,
      "mean": 5.0,
      "min": 5,
      "max": 5
    },
    {
      "dimension": "utilidade_espaco",
      "count": 1,
      "mean": 5.0,
      "min": 5,
      "max": 5
    },
    {
      "dimension": "qualidade_dialogo",
      "count": 1,
      "mean": 4.0,
      "min": 4,
      "max": 4
    },
    {
      "dimension": "sentido_inclusao",
      "count": 1,
      "mean": 5.0,
      "min": 5,
      "max": 5
    }
  ]
}
```

## 12. Casos de erro (validação)
### GET /auth/me sem token

Sem Authorization header → 401.

**Request**

```http
GET /auth/me HTTP/1.1
```

**Response** — `401 Unauthorized`

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Authentication token missing."
  }
}
```

### POST /projects (como cliente)

Cliente não pode criar projetos → 403 `client_cannot_mutate`.

**Request**

```http
POST /projects HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...TAin6w
Content-Type: application/json

{
  "name": "tentativa de cliente",
  "domain": "legal"
}
```

**Response** — `403 Forbidden`

```json
{
  "error": {
    "code": "client_cannot_mutate",
    "message": "Clients cannot mutate projects."
  }
}
```

### POST /likert/consultoria com score fora do range

Pydantic rejeita score > 5 → 422.

**Request**

```http
POST /likert/consultoria HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json

{
  "utilidade_drafts": 99,
  "reducao_friccao": 4,
  "qualidade_resumo": 5,
  "manutenibilidade_mediador": 4
}
```

**Response** — `422 Unprocessable Entity`

```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": [
        "body",
        "utilidade_drafts"
      ],
      "msg": "Input should be less than or equal to 5",
      "input": 99,
      "ctx": {
        "le": 5
      }
    }
  ]
}
```

### GET /projects/{bogus}/detail

Projeto inexistente (ou invisível ao usuário) → 404.

**Request**

```http
GET /projects/00000000-0000-0000-0000-000000000000/detail HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `404 Not Found`

```json
{
  "error": {
    "code": "project_not_found",
    "message": "Project not found: 00000000-0000-0000-0000-000000000000"
  }
}
```

## 13. Cleanup
### DELETE /projects/{id}

Apaga projeto. Cascade para documents, extractions, comments, resumos, drafts.

**Request**

```http
DELETE /projects/8e086056-c45c-46bc-9333-acb819b713b1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUz...XRj7lQ
Content-Type: application/json
```

**Response** — `204 No Content`

```json

```
