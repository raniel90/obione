# Spec — Enriquecimento do artigo ObiOne (layout do professor + rigor de pesquisa)

Data: 2026-07-03 · Base: `atividades/artigo/build_sbc_docx.py` (canônico SBC), `artigo_obione.md` (espelho).

## Objetivo

Reestruturar e enriquecer o artigo para (a) alinhar ao template SBC do professor, (b) incorporar a lista de melhorias mapeada pela equipe e (c) proteger as dimensões de maior peso em revisão por pares (Rigor metodológico 25% + Evidência 25%), conforme crítica pela skill `academic-paper` (o artigo é um Estudo de Caso + DSR, Pattern 4).

## Decisões (aprovadas)

1. **Estrutura**: Implementação como seção central, mas **Método é seção própria** (não subseção enterrada) — para preservar rigor.
2. **Apêndices A + B + C completos**, que carregam o material pesado (protege a proporção do corpo).
3. Antiga "2.5 Posição crítica" **fundida na Introdução**.
4. Rastreabilidade Requisitos→MPO entra na **Implementação**, com referência a **Sommerville** (engenharia de requisitos).
5. "Artefato e Implementação" → **"Implementação"**.
6. Avaliação conduzida **na visão de consultor**; app tem telas para **consultor, administrador e cliente** (Apêndice C).

## Estrutura-alvo

1. **Introdução** — contexto, problema (perda de conhecimento), lacuna dupla, oportunidade (IA), objetivo do observatório e do artigo. Absorve a posição crítica (ferramentas de PM capturam o "o quê", não o "porquê").
2. **Fundamentação Teórica** — 2.1 Observatórios e MPO; 2.2 Gestão do conhecimento em projetos; 2.3 IA Generativa como assistente.
3. **Método** — 3.1 Design Science Research (Hevner et al., 2004; Peffers et al., 2007); 3.2 Desenho da avaliação: instrumento (12 Likert + 3 abertas), duas rodadas (walkthrough curto; 2ª após onboarding e com público mais diverso), **coortes distintas (confundidor: não é o mesmo grupo antes/depois)**, perspectiva de avaliação = consultor, leitura como casos (sem inferência estatística).
4. **Implementação** (proporcional; detalhe pesado nos apêndices) —
   - 4.1 Requisitos e rastreabilidade ao MPO — engenharia de requisitos (**Sommerville**); critério de mapeamento RF→MPO→implementação; amostra no corpo, tabela completa no Apêndice A.
   - 4.2 Arquitetura — backend Java 21 / Spring Boot (web, data-jpa, security, validation), camadas controller/service/repository/entity/dto/mapper, H2 file-based (dev) e PostgreSQL previsto; frontend React 19 / TanStack Start+Router, Vite, bun, react-query, react-hook-form+zod, Tailwind; context-path `/api`, CORS, padrão single-origin (proxy `/api`).
   - 4.3 Camada de IA — 4 papéis (Observadora, Sintetizadora, Configuradora, Consultora); Spring AI; provedor configurável (`mock` determinístico / `openai`); log de sugestões com proveniência (provider/model/timestamp) e aceite; princípio human-in-the-loop.
   - 4.4 Prototipação — uso de **Lovable + React** para prototipar rapidamente as telas antes do build final; ancorado à atividade de design & desenvolvimento do DSR e como insumo para as validações com orientadores.
   - 4.5 Governança por papel — acesso semi-aberto; leituras autenticadas; mutações restritas a consultor/admin; cliente contribui em discussões e vê apenas o seu projeto; isolamento entre clientes; o que cada perfil enxerga.
   - 4.6 Jornada do usuário e construção do MVP — fluxo observação → conversa → aprendizado; wizard IA-first; features entregues (cadastro, cobertura MPO, comunidade por domínio, feed, consolidação de aprendizados, onboarding); telas por perfil (ref. Apêndice C).
5. **Resultados** — viabilidade técnica; percepção comparativa das duas rodadas (Tabela 2, já feita); **nota metodológica**: avaliação na visão de consultor, com o app oferecendo telas para os três perfis (Apêndice C); benefícios esperados; limitações.
6. **Discussão e Lições Aprendidas** (expandida) — decisões arquiteturais (IA assistiva, governança por papel, código vs. low-code); lições: (i) **o pivô — mudar o escopo para refinar o propósito da solução**; (ii) **a IA acelera a construção, mas sem uma definição clara da solução não se chega a lugar nenhum**; (iii) **o esforço de refinamento de escopo após várias validações com os orientadores**; (iv) aprendizados de equipe. Cada lição amarrada à jornada do MVP.
7. **Conclusão + Questões em aberto** — mantém o conteúdo atual (síntese, contribuição, 5 questões em aberto, trabalhos futuros).

**Referências** — acrescenta **Sommerville** (verificar edição/ano por DOI/web na implementação; provável: Software Engineering, 10ª ed., Pearson, 2016). Mantém as 10 fontes já verificadas.

**Apêndices**
- **A — Requisitos com rastreabilidade ao MPO**: tabela RF01…RFn → característica/processo do MPO (com página de Vieira, 2022) → implementação; + **link do Git** (repositório e `requisitos.md`). Fonte: `atividades/requisitos.md` (linhas "Rastreabilidade MPO" por RF).
- **B — Arquitetura**: diagrama/descrição da arquitetura + link aos docs (`arquitetura_backend.md`, `arquitetura_pipeline.md`, `arquitetura_diagrama.md`) no Git.
- **C — Telas por perfil**: prints representativos (home, comunidade, detalhe do projeto, feed, consolidar com IA, wizard) + tabela "tela → perfis que acessam (consultor/admin/cliente)" + link ao `Principais_Telas_ObiOne.pdf`. Fonte dos prints: `atividades/apresentacoes/prints/` e `atividades/telas/`.

## Ajustes de rigor (da crítica academic-paper)

- **Método visível e proporcional** (seção própria) com o desenho da avaliação e o confundidor das coortes — não enterrar o DSR.
- **Implementação proporcional**: detalhe suficiente para credibilidade/reprodutibilidade; material pesado nos apêndices; **cada decisão de design amarrada à pergunta de pesquisa** (coerência).
- Lições de DSR (pivô, refino, validações) tratadas como **evidência reflexiva legítima**, não como digressão.
- Manter enquadramento de **transferibilidade** (não generalização), próprio de estudo de caso.

## Implementação (visão geral, para o writing-plans)

1. Editar `build_sbc_docx.py`: nova estrutura de seções; subseções de Implementação; embutir prints no Apêndice C (`add_picture`); montar Tabela do Apêndice A a partir de `requisitos.md`; helper para hyperlinks (links do Git).
2. Verificar a citação **Sommerville** (web/DOI) antes de inserir; atualizar Referências.
3. Sincronizar `artigo_obione.md` (espelho).
4. Regenerar `Artigo_ObiOne_SBC.docx` + `.pdf` (LibreOffice); QC visual (capa, Método, Implementação, Apêndices).
5. Copiar PDF/docx para o Desktop; commitar no PR #89.

## Fora de escopo

- Executar o protocolo de extração do MPO (permanece trabalho futuro / questão em aberto).
- Novas rodadas de avaliação.
- Mudanças no código do produto (apenas documentação).

## Critérios de aceite

- Estrutura bate com o template do professor + renomes; Método é seção própria com desenho da avaliação e confundidor.
- Implementação cobre arquitetura, camada de IA, prototipação, governança e jornada/MVP, com detalhe pesado nos apêndices.
- Apêndices A/B/C presentes; A com tabela de rastreabilidade + link do Git; C com telas por perfil.
- Sommerville citado e verificado; citações ↔ referências consistentes; 0 em dash.
- docx + PDF regenerados e no Desktop; commit no PR #89.
