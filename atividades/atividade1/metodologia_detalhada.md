# ObiOne: Detalhamento Metodológico

## 1. Método: Design Science Research (DSR)

Baseado em Hevner *et al.* (2004), o estudo segue um ciclo único de DSR com três etapas. O artefato desenvolvido é um **observatório-comunidade de projetos** — sistema sociotécnico que combina pipeline de IA Generativa, dashboard de observação, modelo de acesso semi-aberto e funcionalidades de comunidade (comentários, perfis, resumos automáticos, drafts assistidos).

## 2. Etapas

### 2.1 Consciência do problema (semana 8 — fase preparatória)

- Análise dos *gaps* nos papers de referência (Vieira 2021, 2025, 2026), em especial dos Trabalhos Futuros propostos por Vieira (2022, pp. 215-217) sobre Interatividade (#4), estudos comparativos com outras soluções (#7) e desenvolvimento de soluções computacionais à luz do MPO (#8).
- Definição dos atributos-alvo com base no **Quadro 37 (terceira versão do MPO — Vieira, 2022)**, abrangendo as 8 categorias: geral, *stakeholders*, escopo, cronograma, custos, riscos, mudanças e lições aprendidas.
- Categorização de cada atributo como `estruturado` (datas, valores, *status*) ou `texto_livre` (escopo, riscos narrativos, lições, etc.); atributos não-textuais (imagens/fotos) ficam fora do escopo do pipeline LLM.
- Definição do **protocolo de avaliação híbrido** (ver seção 2.3).
- **Produção do gabarito manual** em **amostra de 3 projetos** (Valença Odontologia como piloto + 2 projetos adicionais) por dois avaliadores independentes — *baseline* para a comparação na seção 2.3. A redução de 5 para 3 projetos justifica-se pela ampliação do escopo na dimensão de comunidade, mantendo a defensibilidade acadêmica para o tamanho de amostra do estudo.

### 2.2 Desenvolvimento do artefato (semanas 9-13)

O artefato é organizado em quatro grupos funcionais, todos materializando dimensões do MPO.

#### Pipeline de extração baseado em LLM

- Entrada: documentos `.docx` de projetos em formato livre.
- Processamento: LLM extrai atributos do Quadro 37 via *prompt* estruturado; cada atributo preenchido carrega o trecho de origem (rastreabilidade); atributos não encontrados são marcados como `null`.
- Saída: JSON estruturado conforme *schema* versionado.
- Persistência com metadados (versão do *prompt*, identificador do modelo LLM, *timestamp*).

#### Camada de comunidade e acesso

- Modelo de acesso **semi-aberto** (Vieira, 2022, p. 189): equipe da consultoria curatoriza todos os projetos; cada cliente acessa apenas o seu.
- Autenticação simples (email + senha, com JWT; sem OAuth).
- Perfis: **Consultor** (acesso pleno) e **Cliente** (acesso restrito ao próprio projeto).
- **Comentários por projeto** em *thread* livre, com possibilidade de resposta entre participantes — materializa o processo `Interagir` (Vieira, 2022, p. 198) e a característica Interatividade (p. 191).
- **Feed *in-app* de novidades** (novos comentários, novos resumos, novas extrações) — materializa o processo `Acompanhar` (p. 198).

#### IA-Assistente da comunidade

- **Resumo do Projeto para o Cliente**: IA Generativa traduz a extração técnica em narrativa acessível ao cliente, materializando o processo `Comunicar` (p. 197) com linguagem cidadã (característica Usabilidade, p. 192).
- **Drafts de "Próximos Passos / Pontos de Atenção"**: IA propõe rascunhos que o consultor revisa antes de publicar para o cliente, reduzindo a fricção operacional de manutenção do observatório.

#### Dashboard de observação

- Visão de portfólio (somente Consultor) com *status* derivado e indicador de cobertura do MPO.
- Visão de detalhe do projeto (Consultor para qualquer projeto; Cliente apenas para o seu) com atributos extraídos, trecho de origem, comentários e resumo gerado pela IA.
- Indicador de **cobertura do MPO** por projeto e no portfólio (*heatmap* projetos × atributos), com destaque visual quando cobertura < 50% e sinalização saudável quando ≥ 80%.

#### Stack técnico

- *Backend*: Python + FastAPI + PostgreSQL.
- *Frontend*: React + Vite + componentes Lovable.
- Comunicação: REST/JSON.
- Ambiente: *Docker Compose* local (sem *deploy* em produção).

### 2.3 Avaliação do artefato (semana 14)

Estudo de caso com cinco projetos reais de domínios distintos (jurídico, saúde, esporte e *branding*), com avaliação em duas perspectivas.

#### 2.3.1 Perspectiva quantitativa

A extração automática do LLM é comparada com o gabarito manual produzido na fase preparatória. Como nem todos os atributos do Quadro 37 admitem comparação determinística, adota-se um **critério híbrido de *match***:

- Atributos `estruturado` (datas, valores, *status*, nomes próprios formais): comparação normalizada exata; cálculo binário de TP/FP/FN.
- Atributos `texto_livre` (escopo, riscos, lições, etc.): rubrica humana 0 / 0,5 / 1 aplicada por dois avaliadores independentes; concordância reportada via *Cohen's Kappa*.

| Métrica | Fórmula | O que mede | Escopo |
|---|---|---|---|
| Cobertura | atributos preenchidos / total de atributos-alvo (Quadro 37) | Abrangência da extração frente ao MPO | Todos os 5 projetos |
| Precisão | atributos corretos / atributos extraídos | Confiabilidade da extração | 3 projetos com gabarito |
| *Recall* | atributos encontrados / atributos existentes no doc | Completude da extração | 3 projetos com gabarito |
| F1-Score | 2 × (Precisão × *Recall*) / (Precisão + *Recall*) | Equilíbrio precisão/*recall* | 3 projetos com gabarito |
| *Kappa* | concordância entre avaliadores (`texto_livre`) | Confiabilidade da rubrica | 3 projetos com gabarito |
| Tempo | minutos por projeto (manual vs. automático) | Ganho de eficiência | 3 projetos com gabarito |

Métricas reportadas separadamente para os grupos `estruturado` e `texto_livre`, mais agregado total.

#### 2.3.2 Perspectiva qualitativa

Aplicação de questionários *Likert* (escala 1-5), **separados por audiência**, refletindo o modelo de acesso semi-aberto e os papéis distintos previstos no MPO (Vieira, 2022, p. 200) para Equipe de Gestão do Observatório e Partes Interessadas dos Projetos.

**Likert da consultoria** (~4 respondentes — equipe interna):

- **Utilidade dos drafts**: os rascunhos gerados pela IA reduzem o trabalho de mediação?
- **Redução de fricção**: o sistema poupa tempo de manutenção do observatório?
- **Qualidade do resumo gerado**: a tradução da extração técnica para o cliente é adequada?
- **Manutenibilidade**: o papel de mediador é sustentável no observatório?

**Likert dos clientes** (~5-10 respondentes — *stakeholders* dos 5 projetos):

- **Clareza do resumo**: entendi o que está sendo observado no meu projeto?
- **Utilidade do espaço**: o observatório me ajudou a acompanhar o projeto?
- **Qualidade do diálogo**: os comentários geraram conversa útil entre eu e a consultoria?
- **Sentido de inclusão**: senti-me participante do observatório, não apenas observador?

#### 2.3.3 Considerações éticas e LGPD

Os documentos de origem contêm dados de projetos reais de clientes em segmentos sensíveis (jurídico, saúde, etc.) e o modelo de acesso semi-aberto implica responsabilidade adicional sobre dados pessoais e estratégicos. A coleta e o uso dos dados seguem:

- **NDA com clientes participantes** do estudo de caso.
- **Consentimento explícito** para uso anonimizado dos resultados no relato/artigo.
- **Isolamento por perfil**: cliente A não acessa dados do cliente B.
- **Criptografia em trânsito** e *logs* de acesso ao observatório.

### 2.4 Escrita e entrega (semanas 15-16)

- Relato de experiência em formato de artigo (~10-15 páginas).
- Slides da apresentação final (~15-20 min).
- *Screencast* de *backup* da demonstração.
- Matriz de rastreabilidade consolidada com resultados.

## 3. Cronograma resumido

Alinhado ao calendário da disciplina TAES (entrega final em 10/07/2026).

| Semana | Data | Atividade | Marco |
|---|---|---|---|
| 8 | 15-21/05 | Fase preparatória (atributos-alvo, protocolo, *schema*, protótipos, *setup*) | — |
| 9 | 22-28/05 | Cadastro + upload + auth; início dos gabaritos (3 projetos) | M1 + Status Report 1 |
| 10 | 29/05-04/06 | Pipeline LLM + comentários; finalização dos gabaritos + matriz semente | — |
| 11 | 05-11/06 | Dashboard + cobertura + perfis (semi-aberto); extração nos 5 projetos | M2 |
| 12 | 12-18/06 | IA-Assistente (Resumo Cliente + Drafts); aplicação da rubrica nos 3 projetos | — |
| 13 | 19-25/06 | Likert lançado; *polish*; consolidação parcial | M3 + Status Report 2 |
| 14 | 26/06-02/07 | Métricas e Likert consolidados; exportação completa | M4 |
| 15 | 03-09/07 | Escrita do relato + estrutura da apresentação + *screencast* | — |
| 16 | 10/07 | **Apresentação final + entrega do artigo** | Entrega |

## 4. Projetos do estudo de caso

| Projeto | Domínio | Complexidade | Gabarito manual? |
|---|---|---|---|
| Valença Odontologia | Jurídico / *Compliance* | Baixa | **Sim — piloto da rubrica** |
| Freire Batista ADV | Jurídico / Saúde Suplementar | Média | Sim |
| Kaka JJ | Esporte / *Branding* | Média | Sim |
| Bem Viver Fitoterápicos | Saúde / Regulatório | Alta | Não (avaliado apenas por cobertura e Likert) |
| Dinoah ADV | Jurídico / *Marketing* | Média | Não (avaliado apenas por cobertura e Likert) |

A escolha dos 3 projetos com gabarito (Valença, Freire Batista, Kaka JJ) considera diversidade de complexidade (Baixa, Média, Média) e dominio (jurídico, jurídico/saúde, esporte/*branding*) para informar conclusões estatísticas defensáveis dentro do escopo amostral do estudo.
