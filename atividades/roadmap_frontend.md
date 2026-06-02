# Roadmap do Frontend — ObiOne

## 1. Propósito

Este documento é a fonte única do **goal do frontend** do ObiOne e do seu estado.
O goal, em uma frase:

> **Toda tela do frontend funcionando e2e, conforme a spec da tela.**

A espinha do doc é o **inventário de telas** (seção 4): bate o olho e vê o que está
verde e o que falta. As demais seções dão o contrato de "pronto" (seção 2), a visão
por milestone (seção 3), o escopo do que falta (seção 5), as pontas soltas (seção 6)
e como rodar as evidências (seção 7).

Numeração de requisitos: **canônica do `requisitos.md`** (RF01–RF19). Ver dívida em §6.

---

## 2. Definição de Pronto (por tela)

Uma tela só é considerada **pronta (✅)** quando satisfaz todos os critérios abaixo:

1. **Implementada conforme a spec** da tela (design + comportamento).
2. **Vitest verde** — testes de componente/integração (Testing Library + jsdom).
3. **e2e Playwright** — pelo menos um spec que dirige a tela **fim-a-fim** contra o
   backend real + `seed-demo`.
4. **Perfil e CBAC respeitados** — o que cada perfil (consultor/admin/cliente) vê e
   não vê está coberto por teste.
5. **Mergeada na `main` via PR** (nunca commit solto de chassis).

Enquanto qualquer critério faltar, a tela é **🔜 (falta)** — mesmo que já exista
placeholder ou código parcial.

---

## 3. Milestones (M0–M5)

| Milestone | Escopo | Telas | Status | PR |
|---|---|---|---|---|
| **M0** | Chassis Vite/React/Tailwind + design system | — (fundação) | ✅ mergeado | #23 |
| **M1** | Auth JWT + roteamento com guards por perfil | Login | ✅ mergeado | #24 |
| **M2** | Lista perfil-aware + detalhe com 44 atributos MPO por categoria + CBAC | Lista, Detalhe | ✅ mergeado | #25 |
| **M3** | Temática (RF13): sugerir/aceitar/histórico (só-staff) | Temática (no detalhe) | ✅ mergeado | #26 |
| **M4** | UI de configuração do CBAC pelo consultor | Config CBAC | ✅ mergeado | #27 |
| **M5** | Cockpit cross-cliente real (agregação por temática) | Cockpit | ✅ mergeado | #28 |

Camada de e2e (Playwright) introduzida no M3 e aplicada retroativamente a M1/M2.

---

## 4. Inventário de telas (espinha)

| Tela | Rota | RFs | Milestone | Status | Evidência (Vitest + e2e) |
|---|---|---|---|---|---|
| **Login** | `/login` | RF01 (autenticar), RF02 (perfis/acesso semi-aberto) | M1 | ✅ | unit de auth/login + `e2e/login.spec.ts` |
| **Lista / Observatório** | `/projects` | RF07 (portfólio perfil-aware) | M2 | ✅ | unit da lista + `e2e/projects-list.spec.ts` |
| **Detalhe do projeto** | `/projects/:id` | RF08 (detalhe), RF09 (cobertura); consome RF04 (CBAC) | M2 | ✅ | `ProjectDetailPage.test.tsx` + `e2e/project-detail.spec.ts` |
| **Temática (IA)** | seção no detalhe (só-staff) | RF13 (categorizar por temática/segmento) | M3 | ✅ | `theme-*.test.tsx` + `e2e/themes.spec.ts` |
| **Config CBAC** | `/projects/:id/visibility` | RF04 (configurar visibilidade via CBAC) | M4 | ✅ | `visibility-*.test.tsx` + `ProjectVisibilityPage.test.tsx` + `e2e/visibility.spec.ts` |
| **Cockpit do portfólio** | `/portfolio/cockpit` | RF14 (cockpit cross-cliente) | M5 | ✅ | `cockpit-kpis.test.tsx` + `theme-breakdown-table.test.tsx` + `PortfolioCockpitPage.test.tsx` + `e2e/cockpit.spec.ts` |

Legenda: ✅ pronto (todos os critérios da §2) · 🔜 falta (não atende a §2 ainda).

Snapshot de verificação (após RF12/drafts, PR #30): **Vitest 154/154** (41 arquivos) ·
**Playwright 21/21** (login, lista, detalhe/CBAC, temática, visibilidade, cockpit, comentários, drafts) · build + lint limpos.

**Roadmap de telas COMPLETO (M0–M5).** As 6 telas atendem à Definição de Pronto (§2).

---

## 5. O que falta

**Nenhuma tela pendente** — o roadmap M0–M5 está completo (6 telas ✅, cada uma com
Vitest + e2e conforme a Definição de Pronto).

O que resta são itens de **backlog fora dos milestones de tela**, que entram em ciclos
futuros (spec → plano → implementação próprios): RF10 (postar comentário — hoje só
leitura), RF11 (feed in-app), RF12 (drafts de Próximos Passos / Pontos de Atenção),
RF15–RF18 (importar/validar gabarito, comparar extração × gabarito, Likert da
consultoria e dos clientes), RF19 (exportar resultados consolidados). Ver também §6.

---

## 6. Dívidas & notas

- **Numeração de RFs desatualizada em `telas_observatorio.md`.** Aquele doc usa um
  esquema antigo, anterior à renumeração do `requisitos.md` (canônico, RF01–RF19).
  Mapeamento explícito do que o `telas_observatorio.md` cita → canônico:

  | Tela (`telas_observatorio.md`) | RF citado lá | RF canônico (`requisitos.md`) |
  |---|---|---|
  | Tela de Acesso | RF01, RF02 | RF01, RF02 (iguais) |
  | Observatório de Projetos | RF07, RF09, **RF20** | RF07, RF09, **RF14** (cockpit) |
  | Domínios | **RF19**, **RF20** | **RF13** (temática), **RF14** (comparação) |
  | Design System | RNF02 | RNF02 (igual) |

  Ou seja: o "RF19" de lá = **RF13** (categorizar por temática) e o "RF20" de lá =
  **RF14** (cockpit/comparação cross-projeto). No `requisitos.md` atual, "RF19" é
  "Exportar resultados consolidados" e **não existe RF20**. Corrigir o
  `telas_observatorio.md` em si fica fora do escopo deste roadmap (dívida registrada;
  este roadmap usa sempre a numeração canônica).
- **e2e de temática exige `LLM_PROVIDER=mock` no backend.** Com o provedor padrão de
  LLM (ex.: `ollama/...`), o endpoint `themes/suggest` falha com `APIConnectionError`
  (500) por não alcançar um LLM externo. O classificador `mock` é determinístico por
  keyword e é o mesmo que a suíte de testes do backend fixa. O `seed-demo` já usa o
  mock diretamente no código, por isso seeda uma sugestão mesmo com outro provedor
  configurado.
- **RF10 (comentar) — ✅ ENTREGUE (PR #29).** Os comentários no detalhe deixaram de
  ser só-leitura: postar (qualquer um que vê o projeto, incl. cliente — **primeira
  interação de escrita do cliente**), editar (autor), excluir (autor ou moderação:
  admin/consultor dono). Threading (respostas 1-nível) fica para uma iteração futura.
- **RF12 (drafts / IA) — ✅ ENTREGUE (PR #30).** Seção "Próximos Passos & Pontos de
  Atenção" no detalhe: staff gera com IA (lote via LLM), edita, publica e descarta;
  cliente vê só os publicados (read-only). Fecha o tripé da IA (extração → temática →
  drafts). Fora de escopo: reordenar, regenerar item, histórico, despublicar.
- **RFs ainda não cobertos por tela no frontend** (fora dos milestones de tela
  atuais): RF11 (feed in-app de novidades), RF15–RF18 (importar/validar gabarito,
  comparar extração × gabarito, Likert da consultoria e dos clientes — o painel de
  avaliação no detalhe apenas exibe métricas quando presentes), RF19 (exportar
  resultados consolidados). Entram em ciclos futuros (spec → plano → implementação) ou
  ficam como escopo de backend/CLI.

---

## 7. Como rodar as evidências

Pré-requisito dos e2e: backend de pé e seedado, com o classificador **mock**.

```bash
# Backend (com LLM_PROVIDER=mock no backend/.env), em outra aba:
cd backend && make up && make seed-demo
#   consultor@obione.dev / cliente1..3@obione.dev — senha demo12345678
#   4 projetos; cliente1 com CBAC só em "conteudo_geral"; projeto 2 com tema aceito

# Frontend — testes unitários/integração (Vitest):
cd frontend && npm test

# Frontend — e2e (Playwright; sobe o Vite automaticamente e reusa se já estiver no ar):
cd frontend && npm run test:e2e
```
