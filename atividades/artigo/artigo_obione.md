# ObiOne: um observatório-comunidade de projetos viabilizado por IA Generativa

Bruno Rocha, Cynthia Oliveira, Moisés Júnior, Raniel Silva

Escola Politécnica de Pernambuco — Universidade de Pernambuco (UPE) — Recife — PE — Brasil
Orientador: Prof. Ivaldir Honório de Farias Júnior
{bruno.rocha, cynthia.oliveira, moises.junior, raniel.silva}@upe.br

> **Nota.** Este Markdown é a fonte de conteúdo; a versão canônica no template SBC (A4,
> Times, título 16pt, seções 13pt) é gerada por `build_sbc_docx.py` → `Artigo_ObiOne_SBC.docx`
> / `.pdf`.

## Resumo

Consultorias acumulam conhecimento valioso a cada projeto, mas raramente dispõem de um sistema leve o bastante para preservá-lo e reaproveitá-lo entre clientes. Este artigo apresenta o ObiOne, um observatório-comunidade de projetos construído sobre o Modelo de Observatório de Projetos (MPO) e potencializado por IA Generativa. O trabalho segue a Design Science Research: além de construir o artefato, avalia seu funcionamento real (ciclo exercitado de ponta a ponta com IA da OpenAI) e a percepção de valor em duas rodadas de piloto, com oito consultores no total. No acumulado os resultados foram positivos (média 4,3 de 5); a segunda rodada, após a inclusão de um onboarding e com um público mais diverso, foi mais crítica (4,1 ante 4,48) e manteve a clareza inicial (3,8) como o principal ponto de atenção. A principal contribuição é a demonstração empírica de que o MPO é implementável com IA generativa em uma consultoria real.

**Palavras-chave:** observatório de projetos; IA generativa; gestão do conhecimento; Design Science Research; MPO.

## 1. Introdução

Em consultorias, o conhecimento produzido em um projeto tende a ficar com quem o viveu. Lições sobre o que deu certo, riscos que se materializaram e decisões que mudaram o rumo do trabalho raramente são capturadas de forma reaproveitável. Revisões sistemáticas a respeito da gestão do conhecimento mostram que a captura, análise e aplicação de lições aprendidas dependem mais de fatores culturais e organizacionais do que de ferramentas (Henz, 2024; Kamudyariwa et al., 2025). O obstáculo prático é o custo, visto que manter um repositório vivo de conhecimento exige um esforço contínuo que poucas consultorias de pequeno e médio porte conseguem sustentar.

Observatórios de projetos são uma resposta a esse problema. São sistemas de informação que apoiam a coleta, organização, armazenamento, análise e a publicação de observações, promovendo transparência (Vieira et al., CISTI). O Modelo de Observatório de Projetos (MPO) consolida essa abordagem em um conjunto de conceitos hierárquicos que orienta a concepção desses sistemas (Vieira, 2022; de Farias Junior et al., 2025). Ferramentas usuais de gestão de projetos registram o que foi feito, mas não capturam os motivos das decisões e não transformam observações em conhecimento compartilhado.

Diante desse cenário, sobressaem-se duas lacunas principais. A primeira é técnica e empírica: embora o MPO tenha sido validado conceitualmente e em estudos de caso (de Farias Junior et al., 2025), nenhuma implementação conhecida o operacionaliza com IA generativa. A segunda é comunitária: os observatórios descritos na literatura tratam da organização executora, sem explorar a participação do cliente como ator do ciclo de conhecimento. Nesse contexto, a IA generativa surge como uma janela de oportunidade, pois reduz o custo de extrair e sintetizar informação textual.

Alinhado a essa oportunidade, o propósito do observatório é fornecer à consultoria um ambiente intuitivo para observar seus projetos, debater achados e consolidar aprendizados reaproveitáveis. Diante disso, o objetivo deste artigo é investigar como a IA generativa pode viabilizar um observatório-comunidade de projetos, de modo a reduzir a fricção de manutenção e promover o engajamento entre a organização executora e seus clientes. Para isso, o trabalho apresenta o ObiOne, detalhando sua construção e trazendo uma avaliação de uso e percepção.

## 2. Fundamentação Teórica

### 2.1 Observatórios de projetos e o MPO

Observatórios de projetos são sistemas de informação que sistematizam a transparência por meio da observação (Vieira et al., CISTI). O MPO é um modelo conceitual para esses observatórios, organizado a partir de conceitos estruturados em três níveis, geral, intermediário e específico (de Farias Junior et al., 2025). Sua versão de tese sistematiza atributos de observação no Quadro 37, abrangendo dimensões que vão de dados estruturais do projeto a registros narrativos como escopo, riscos e lições aprendidas (Vieira, 2022).

### 2.2 Gestão do conhecimento em projetos

A literatura de gestão do conhecimento trata da captura e do reaproveitamento do que se aprende ao longo do trabalho. Revisões recentes apontam que a implementação efetiva depende de cultura, apoio gerencial e melhoria contínua (Henz, 2024), e que em projetos complexos a aprendizagem se sustenta quando a captura, análise e a aplicação de lições são sistemáticas (Kamudyariwa et al., 2025).

### 2.3 IA Generativa como assistente

Modelos de linguagem têm sido estudados como apoio à análise textual. Estudos recentes mostram que a IA acelera a identificação de temas descritivos e reduz o esforço operacional, mas perde nuances que dependem de conhecimento contextual humano (CHI, 2026; medRxiv, 2024). O consenso emergente é o de uma parceria guiada, em que o humano permanece como líder intelectual, princípio conhecido como human-in-the-loop.

## 3. Método

### 3.1 Design Science Research

A construção do ObiOne segue a Design Science Research, que estabelece o artefato como forma legítima de pesquisa (Hevner et al., 2004) e organiza o trabalho em atividades de problema, objetivos, design, demonstração, avaliação e comunicação (Peffers et al., 2007). Ferramentas usuais de gestão capturam o estado das tarefas, mas não o raciocínio por trás das decisões. O MPO e o ObiOne solucionam essa lacuna ao elevar a observação a um elemento central do processo.

## 4. Estudo de Caso

### 4.1 Contexto, stakeholders e abordagem

O objeto do estudo de caso escolhido aborda um observatório de projetos para uma consultoria. Os stakeholders são a consultoria de marketing, como organização executora e curadora, e seus clientes, que acessam cada um o próprio projeto. A abordagem é a Design Science Research: por ser uma pergunta de viabilidade, responder exige construir o sistema, colocá-lo em uso e observar o resultado (Hevner et al., 2004; Peffers et al., 2007).

### 4.2 Requisitos e rastreabilidade ao MPO

A construção partiu de um mapeamento explícito entre requisitos e o MPO, garantindo que o artefato implementasse o modelo. O critério associa cada requisito a uma dimensão ou característica do MPO e à sua materialização no sistema. A Tabela 1 apresenta uma amostra representativa.

**Tabela 1. Amostra da rastreabilidade requisito → MPO → implementação.**

| Requisito (ObiOne) | Âncora no MPO | Implementação |
|---|---|---|
| Catálogo de atributos de observação | Quadro 37: 44 atributos em 8 dimensões (Vieira, 2022) | `mpo/MpoCatalog` |
| Cobertura de observação por projeto | Característica Abrangência (Vieira, 2022) | `GET /projects/{id}/coverage` |
| Governança de acesso por papel | Característica Segurança (Vieira, 2022) | filtro por papel (consultor/cliente) |
| Registro e acompanhamento | Processos Acompanhar e Avaliar (Vieira, 2022) | ciclo observação → conversa → aprendizado |
| Consolidação de aprendizados | Transparência e disseminação (de Farias Junior et al., 2025) | comunidade por domínio |

A cobertura resultante abrange os 44 atributos do Quadro 37 em 8 dimensões. Trata-se de cobertura arquitetural: o sistema provê os campos e os fluxos correspondentes. A avaliação empírica da qualidade da extração é uma frente prevista no protocolo, ainda não executada (Seção 5.4).

### 4.3 Arquitetura e ferramentas

O ObiOne é uma aplicação web. O backend usa Java 21 e Spring Boot, com persistência via JPA; o frontend usa React e TanStack Router. O provedor de IA é configurável, com um modo determinístico para testes e o provedor da OpenAI para uso real. Não foram usadas plataformas low-code/no-code: o sistema foi desenvolvido em código, o que deu controle sobre o pipeline de IA e sobre a governança.

### 4.4 Pipeline de IA, governança e ciclo

A IA atua em quatro papéis assistivos. A Observadora sugere observações ancoradas na gramática do MPO; a Sintetizadora consolida conversas em aprendizados; a Configuradora apoia o cadastro e a categorização de domínio; a Consultora apoia a leitura do portfólio. Cada sugestão é registrada com proveniência e indicação de aceite, permitindo auditar o uso da IA.

O acesso é semi-aberto: a consultoria enxerga todo o portfólio e conduz a curadoria; cada cliente acessa apenas o seu projeto e participa das conversas. As mutações são restritas a consultor e administrador. Uma decisão central, e não óbvia, é a de que a IA nunca publica sozinha: ela sugere, e o consultor revisa e decide. A escolha pelo human-in-the-loop preserva a responsabilidade humana, dá rastreabilidade às sugestões e protege contra a dependência tecnológica (CHI, 2026; medRxiv, 2024). O fluxo central conecta cadastro assistido, registro de observações, conversa na comunidade e consolidação de aprendizados, com um feed que reflete a atividade.

## 5. Resultados

### 5.1 Viabilidade técnica

Em junho de 2026, o ciclo foi exercitado de ponta a ponta com a IA da OpenAI e dados de simulação. As quatro frentes assistivas operaram de forma integrada: cadastro, sugestão de observações priorizadas pelos riscos declarados, aceite pelo consultor, alimentação da cobertura, conversa com participação do cliente e atualização do feed. A governança por papel foi confirmada na interface.

### 5.2 Percepção de valor

A percepção de valor foi medida em duas rodadas de piloto com quatro consultores cada, aplicando o mesmo instrumento de doze afirmações Likert e três perguntas abertas. A primeira rodada ocorreu após um walkthrough curto; a segunda, após a inclusão de um onboarding de primeiro acesso e outros ajustes, com um público mais diverso (incluindo um gestor e mais usuários de planilhas). A primeira rodada obteve média 4,48 de 5, com 44 de 48 respostas nas notas 4 ou 5 e 29 máximas. A segunda foi mais crítica: média 4,1, com 36 de 48 respostas positivas e 19 máximas. No acumulado dos oito participantes, a média foi 4,3 de 5, com 80 de 96 respostas positivas. A Tabela 2 apresenta o comparativo por dimensão entre as duas rodadas.

**Tabela 2. Médias por dimensão nas duas rodadas (escala 1 a 5, N=4 por rodada).**

| Dimensão | 1ª | 2ª | Δ | Dimensão | 1ª | 2ª | Δ |
|---|---|---|---|---|---|---|---|
| Clareza | 3,8 | 3,8 | 0,0 | Comunidade | 4,8 | 4,2 | -0,5 |
| Organização | 4,8 | 4,0 | -0,8 | Aprendizados | 5,0 | 4,2 | -0,8 |
| Usabilidade | 4,5 | 4,5 | 0,0 | IA assistiva | 4,5 | 4,0 | -0,5 |
| Conteúdo | 4,8 | 4,8 | 0,0 | Portfólio | 4,2 | 4,2 | 0,0 |
| Diferenciação | 4,2 | 3,8 | -0,5 | Governança | 5,0 | 3,8 | -1,2 |
| Ciclo de conhec. | 4,0 | 4,2 | +0,2 | Intenção de uso | 4,2 | 4,0 | -0,2 |

A segunda rodada leu o produto de forma mais crítica em governança (-1,2), organização e aprendizados (-0,8 cada), comunidade, diferenciação e IA assistiva (-0,5 cada). Conteúdo, usabilidade, portfólio e, notadamente, a clareza permaneceram estáveis, e o ciclo de conhecimento evoluiu (+0,2). A queda é atribuída, em parte, a um público mais diverso e crítico e, em parte, à fricção inicial que persiste: isolar o efeito do onboarding exigiria um desenho controlado com os mesmos usuários antes e depois. Ainda assim, o valor central se manteve nas respostas abertas, em que a IA passou a aparecer como força ("aprendizado consolidado através da IA") e o produto foi descrito como amigável e que integra tecnologia e educação, enquanto o alerta recorrente seguiu sendo a clareza e a navegação no primeiro uso.

### 5.3 Benefícios esperados

Os benefícios esperados com a solução incluem a redução do custo de manutenção do conhecimento entre projetos, o fortalecimento do relacionamento com os clientes por meio de maior engajamento e comunicação na comunidade, e o reaproveitamento de aprendizados já consolidados em novos projetos do mesmo domínio.

### 5.4 Limitações

As duas rodadas somam oito participantes de uma mesma consultoria, em ciclos distintos e com composição diferente; os resultados são reportados como casos, sem inferência estatística, e a comparação entre rodadas é exploratória. A clareza permaneceu como o principal ponto de atenção (3,8 nas duas rodadas): a inclusão de um onboarding de primeiro acesso não moveu esse indicador, o que sugere que a orientação inicial precisa ir além de um passo introdutório, na direção de uma navegação mais guiada. Como a segunda rodada usou participantes distintos, não é possível separar o efeito do onboarding da mudança de público. Por fim, a avaliação da qualidade da extração dos atributos do MPO, prevista no protocolo, ainda não foi executada.

## 6. Discussões e Lições Aprendidas

Os resultados confirmam o MPO como base válida e mostram que ele é implementável com IA generativa a um custo viável para uma consultoria de pequeno e médio porte. Estudos anteriores avaliaram o modelo conceitualmente e em casos (de Farias Junior et al., 2025); o ObiOne acrescenta uma implementação operacional com IA. A IA reduz a fricção de iniciar o ciclo; à objeção de que criaria dependência, o desenho responde com o human-in-the-loop, e as respostas abertas sustentam que o valor percebido está no que a comunidade produz e no aprendizado consolidado com apoio da IA. A segunda rodada, mais crítica, deixa claro que a restrição dominante para a adoção não está no ciclo em si, mas na experiência inicial: enquanto a clareza e a navegação não forem resolvidas, o valor demora a ser percebido. O fato de o onboarding não ter movido a clareza indica que o próximo passo é uma navegação guiada, com menu evidente, fluxo em etapas e exemplos práticos.

Como decisões arquiteturais, destacam-se a IA estritamente assistiva e a governança por papel, que viabiliza o acesso semi-aberto com isolamento entre clientes. Entre vantagens e limitações das ferramentas, o desenvolvimento em código deu controle sobre o pipeline e a governança, ao custo de mais esforço do que uma abordagem low-code. A experiência de uso do MPO mostrou que traduzir 44 atributos em uma interface sem jargão é mais difícil do que implementá-los.

Quanto aos aprendizados da equipe, no plano operacional o escopo amplo frente ao prazo exigiu disciplina de cronograma e trabalho de preparação de dados e integração contínua, com deslizes de data corrigidos ao longo do projeto. No plano técnico, os principais desafios foram a integração da IA, a configuração de acesso remoto para validação e a manutenção do ambiente. No plano conceitual, entender o MPO em profundidade foi determinante. No plano de equipe, coordenar quatro integrantes e integrar frentes de extração, frontend, avaliação e escrita exigiu comunicação constante.

## 7. Conclusão

O custo de manter um observatório de projetos caiu com a IA generativa, mas o diferencial de valor é a comunidade, e isso não é substituível por tecnologia. Como síntese da experiência, o ObiOne demonstra empiricamente que o MPO é implementável com IA generativa em uma consultoria real, e que a participação de consultoria e clientes em um ciclo comum de conhecimento distingue o observatório de uma ferramenta de gestão.

A principal contribuição é essa demonstração empírica. Como evoluções futuras, destacam-se consolidar a navegação guiada e realizar uma nova rodada, com os mesmos usuários antes e depois, para verificar a recuperação dos indicadores de clareza e de experiência inicial; ampliar a validação com mais participantes e domínios; avaliar o impacto da IA na qualidade dos aprendizados, e não apenas na redução de fricção; e explorar a síntese cross-projeto, que reconhece padrões entre clientes e ficou fora do escopo deste estudo.

## Referências

de Farias Junior, I. H., Vieira, J. K. M., de Moura, H. P. and Sampaio, L. T. (2025) "A Conceptual Model for Project Observatories", IEEE Access, v. 13. DOI: 10.1109/ACCESS.2025.3589743.

Henz, P. (2024) "Knowledge management implementation: A systematic literature review", Knowledge and Process Management. DOI: 10.1002/kpm.1780.

Hevner, A. R., March, S. T., Park, J. and Ram, S. (2004) "Design Science in Information Systems Research", MIS Quarterly, v. 28, n. 1, p. 75-106. DOI: 10.2307/25148625.

Kamudyariwa, X. B., Osobajo, O. A., Oke, A. and Adebayo, Y. (2025) "Application of the systemic lessons learned knowledge model to learning in complex projects". DOI: 10.1177/13505076251339433.

Peffers, K., Tuunanen, T., Rothenberger, M. A. and Chatterjee, S. (2007) "A Design Science Research Methodology for Information Systems Research", Journal of Management Information Systems, v. 24, n. 3, p. 45-77. DOI: 10.2753/MIS0742-1222240302.

"Generative AI for Thematic Analysis in a Maternal Health Study: Coding Semi-structured Interviews using Large Language Models" (2024), medRxiv (preprint). DOI: 10.1101/2024.09.16.24313707.

"Qualitative Coding Analysis through Open-Source Large Language Models: A User Study and Design Recommendations" (2026), In: CHI Conference on Human Factors in Computing Systems, Extended Abstracts. DOI: 10.1145/3772363.3798320.

Vieira, J. K. M. (2022) "Observatórios de Projetos: Um Modelo Conceitual", Tese de Doutorado, Centro de Informática, Universidade Federal de Pernambuco, Recife.

Vieira, J. K. M., de Farias Junior, I. H. and de Moura, H. P. "Observatories as Transparency Instruments for Projects", In: Conferência Ibérica de Sistemas e Tecnologias de Informação (CISTI).

Vieira, J. K. M., de Farias Junior, I. H. and de Moura, H. P. "Utilization of a Conceptual Model in Projects Observatories Development: A Case Study".

## Apêndices

O material completo do projeto (requisitos, código do backend e do frontend, arquitetura, protocolo de avaliação e telas) está disponível no repositório do ObiOne no GitHub:

- Repositório: https://github.com/raniel90/obione
- Requisitos: https://github.com/raniel90/obione/blob/main/atividades/requisitos.md
- Código (backend e frontend): https://github.com/raniel90/obione/tree/main
- Arquitetura e protocolo de avaliação: https://github.com/raniel90/obione/tree/main/atividades
