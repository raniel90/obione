# ObiOne: um observatório-comunidade de projetos viabilizado por IA Generativa

## Resumo

Consultorias acumulam conhecimento valioso a cada projeto, mas raramente dispõem de um sistema leve o bastante para preservá-lo e reaproveitá-lo entre clientes. Este artigo apresenta o ObiOne, um observatório-comunidade de projetos construído sobre o Modelo de Observatório de Projetos (MPO) e potencializado por IA Generativa. O trabalho segue a Design Science Research: além de construir o artefato, avalia seu funcionamento real (ciclo exercitado de ponta a ponta com IA da OpenAI) e a percepção de valor em um piloto com quatro consultores. Os resultados foram positivos (média 4,48 de 5), com governança e aprendizados como dimensões mais fortes (5,0) e a clareza inicial como único ponto de atenção (3,8). A principal contribuição é a demonstração empírica de que o MPO é implementável com IA generativa em uma consultoria real, e a evidência de que o diferencial percebido de um observatório está na dimensão comunitária, não nas funcionalidades de IA isoladamente.

**Palavras-chave:** observatório de projetos; IA generativa; gestão do conhecimento; Design Science Research; MPO.

## Abstract

Consultancies accumulate valuable knowledge in every project, yet they rarely have a system light enough to preserve and reuse it across clients. This paper presents ObiOne, a community-oriented project observatory built on the Model for Project Observatories (MPO) and powered by Generative AI. The work follows Design Science Research: beyond building the artifact, it evaluates its real operation (the cycle exercised end to end with OpenAI's AI) and the perceived value in a pilot with four consultants. Results were positive (mean 4.48 of 5), with governance and consolidated learnings as the strongest dimensions (5.0) and initial clarity as the single attention point (3.8). The main contribution is the empirical demonstration that the MPO is implementable with generative AI in a real consultancy, and the evidence that the perceived differentiator of an observatory lies in its community dimension, not in AI features alone.

**Keywords:** project observatory; generative AI; knowledge management; Design Science Research; MPO.

## 1. Introdução

Em consultorias, o conhecimento produzido em um projeto tende a ficar com quem o viveu. Lições sobre o que deu certo, sobre riscos que se materializaram e sobre decisões que mudaram o rumo do trabalho raramente são capturadas de forma reaproveitável. Revisões sistemáticas sobre gestão do conhecimento mostram que a captura, a análise e a aplicação de lições aprendidas dependem mais de fatores culturais e organizacionais do que de ferramentas (Henz, 2024; Kamudyariwa et al., 2025). O obstáculo prático é o custo: manter um repositório vivo de conhecimento exige um esforço contínuo que poucas consultorias de pequeno e médio porte conseguem sustentar.

Observatórios de projetos são uma resposta a esse problema. Eles são sistemas de informação que apoiam a coleta, a organização, o armazenamento, a análise e a publicação de observações, promovendo transparência (Vieira et al., CISTI). O Modelo de Observatório de Projetos (MPO) consolida essa abordagem em um conjunto de conceitos hierárquicos que orienta a concepção desses sistemas (Vieira, 2022; de Farias Junior et al., 2025). Ferramentas usuais de gestão de projetos, como quadros Kanban e dashboards, registram o que foi feito, mas não capturam o porquê das decisões nem transformam observações em conhecimento compartilhado.

Há duas lacunas. A primeira é técnica e empírica: embora o MPO tenha sido validado conceitualmente e em estudos de caso (de Farias Junior et al., 2025), nenhuma implementação conhecida o operacionaliza com IA generativa. A segunda é comunitária: os observatórios descritos na literatura tratam da organização executora, sem explorar a participação do cliente como ator do ciclo de conhecimento. A IA generativa abriu uma janela de oportunidade ao reduzir o custo de extrair e sintetizar informação textual, o que torna oportuno revisitar o MPO sob essa ótica.

Este artigo investiga a seguinte pergunta: como a IA generativa pode viabilizar um observatório-comunidade de projetos, reduzindo a fricção de manutenção e promovendo o engajamento entre a organização executora e seus clientes? Para respondê-la, apresenta o ObiOne, descreve sua construção e relata uma avaliação de uso e percepção. As seções seguintes fundamentam o trabalho, estabelecem a rastreabilidade entre requisitos e MPO, detalham o método, descrevem o artefato, reportam a avaliação, discutem os achados e concluem com lições aprendidas.

## 2. Referencial Teórico

### 2.1 Modelo de Observatório de Projetos (MPO)

O MPO é um modelo conceitual para observatórios de projetos, organizado a partir de um conjunto de conceitos estruturados em três níveis (geral, intermediário e específico) (de Farias Junior et al., 2025). Sua versão de tese sistematiza atributos de observação no chamado Quadro 37, abrangendo dimensões que vão de dados estruturais do projeto a registros narrativos como escopo, riscos e lições aprendidas (Vieira, 2022). O modelo nasce de uma perspectiva sociotécnica e relaciona transparência e governança a sistemas de apoio à gestão de projetos.

### 2.2 Gestão do conhecimento em projetos

A literatura de gestão do conhecimento trata da captura e do reaproveitamento do que se aprende ao longo do trabalho. Revisões recentes apontam que a implementação efetiva depende de cultura, apoio gerencial e melhoria contínua, e que a ausência desses fatores faz práticas de lições aprendidas falharem independentemente da tecnologia adotada (Henz, 2024). Em projetos complexos, a aprendizagem organizacional se sustenta quando a captura, a análise e a aplicação de lições são sistemáticas (Kamudyariwa et al., 2025). O observatório atua exatamente nesse ponto: dá um lugar e um ritual para que o conhecimento não se perca.

### 2.3 IA Generativa como assistente de processos

Modelos de linguagem têm sido estudados como apoio a tarefas de análise textual, incluindo codificação e síntese qualitativa. Estudos recentes mostram que a IA acelera a identificação de temas descritivos e reduz o esforço operacional, mas perde nuances que dependem de conhecimento contextual humano (estudo CHI, 2026; estudo medRxiv, 2024). O consenso emergente é o de uma parceria guiada, em que o humano permanece como líder intelectual e delega à IA tarefas estruturadas. Esse princípio, conhecido como human-in-the-loop, é central para o uso responsável de IA generativa em processos de conhecimento.

### 2.4 Design Science Research

A Design Science Research (DSR) estabelece a construção de artefatos como forma legítima de pesquisa, complementar à ciência comportamental (Hevner et al., 2004). O método operacional mais difundido organiza o trabalho em seis atividades: identificação do problema, definição de objetivos, design e desenvolvimento, demonstração, avaliação e comunicação (Peffers et al., 2007). A DSR é adequada a perguntas de viabilidade, em que a resposta depende de construir e avaliar a solução.

### 2.5 Posição crítica

Ferramentas de gestão de projetos capturam o estado e o andamento das tarefas, mas não o raciocínio por trás das decisões nem o conhecimento que delas decorre. O MPO endereça essa lacuna ao tratar a observação, e não apenas a execução, como objeto de primeira classe. O ObiOne se situa nessa tradição e a estende em duas direções: a operacionalização com IA e a abertura controlada para o cliente.

## 3. Rastreabilidade dos Requisitos ao MPO

A construção do ObiOne partiu de um mapeamento explícito entre requisitos e o MPO, garantindo que o artefato implementasse o modelo, e não apenas se inspirasse nele. O critério associa cada requisito funcional a uma dimensão ou característica do MPO e à sua materialização no sistema (endpoint ou tela). A Tabela 1 apresenta uma amostra representativa.

**Tabela 1. Amostra da rastreabilidade requisito → MPO → implementação.**

| Requisito (ObiOne) | Âncora no MPO | Implementação |
|---|---|---|
| Catálogo de atributos de observação | Quadro 37, 44 atributos em 8 dimensões (Vieira, 2022) | `mpo/MpoCatalog` |
| Cobertura de observação por projeto | Característica Abrangência (Vieira, 2022) | `GET /projects/{id}/coverage` |
| Governança de acesso por papel | Característica Segurança (Vieira, 2022) | filtro por papel (consultor/cliente) |
| Registro e acompanhamento de observações | Processos Acompanhar e Avaliar (Vieira, 2022) | ciclo observação → conversa → aprendizado |
| Consolidação de aprendizados | Transparência e disseminação (de Farias Junior et al., 2025) | comunidade por domínio |

A cobertura resultante abrange os 44 atributos do Quadro 37 distribuídos em 8 dimensões. Trata-se de uma cobertura arquitetural: o sistema provê os campos e os fluxos correspondentes. A avaliação empírica da qualidade da extração desses atributos é uma frente prevista no protocolo, ainda não executada, e é registrada como limitação (Seção 4.3).

## 4. Método

### 4.1 Justificativa da DSR

A pergunta de pesquisa é uma pergunta de viabilidade. Responder se a IA generativa pode viabilizar um observatório-comunidade exige construir o sistema, colocá-lo em uso e observar o resultado. Por isso, a DSR é o método adotado (Hevner et al., 2004; Peffers et al., 2007). Um questionário isolado mediria apenas percepção, sem evidência de que o ciclo de fato funciona. O trabalho combina, portanto, construção do artefato, demonstração de uso real e medição de percepção.

### 4.2 Frentes avaliativas

A avaliação tem três frentes complementares. A primeira é a viabilidade técnica do pipeline de IA, demonstrada pelo exercício do ciclo completo com IA real. A segunda é a categorização de domínio por IA, que apoia a organização das comunidades. A terceira é a avaliação qualitativa de percepção, conduzida como piloto com quatro consultores, após um walkthrough curto pelo sistema, usando uma escala Likert de 1 a 5 sobre doze dimensões e três perguntas abertas.

### 4.3 Limitações do método

O piloto tem quatro participantes, todos de uma mesma consultoria de marketing. Os resultados são reportados como casos, sem inferência estatística. Além disso, a avaliação da qualidade da extração dos atributos do MPO, prevista no protocolo com dois avaliadores independentes, ainda não foi executada até a redação deste artigo. A cobertura declarada na Seção 3 é, portanto, arquitetural, e a generalização dos achados é limitada ao contexto estudado.

## 5. Artefato e Implementação

### 5.1 Arquitetura

O ObiOne é uma aplicação web. O backend usa Java 21 e Spring Boot, com persistência via JPA; o frontend usa React e TanStack Router. A autenticação, neste estágio, é baseada em token simples, suficiente para o estudo. O provedor de IA é configurável, com um modo determinístico para testes e o provedor da OpenAI para uso real.

### 5.2 Pipeline de IA em quatro papéis

A IA atua em quatro papéis assistivos ao longo do ciclo. A Observadora sugere observações ancoradas na gramática do MPO. A Sintetizadora consolida conversas em aprendizados reaproveitáveis. A Configuradora apoia o cadastro e a categorização de domínio. A Consultora apoia a leitura do portfólio. Cada sugestão é registrada com proveniência (provedor, modelo, instante) e com indicação de aceite, o que permite auditar o uso da IA.

### 5.3 Governança por papel

O acesso é semi-aberto. A consultoria enxerga todo o portfólio e conduz a curadoria; cada cliente acessa apenas o seu próprio projeto e participa das conversas. As mutações são restritas aos papéis de consultor e administrador, enquanto o cliente contribui em discussões. A visibilidade resultante é determinada pelo papel, garantindo isolamento entre clientes.

### 5.4 Decisão de design: IA sempre assistiva

Uma decisão central, e não óbvia, é a de que a IA nunca publica sozinha. Ela sugere; o consultor revisa e decide. Tecnicamente seria possível automatizar a publicação, mas a escolha pelo human-in-the-loop é deliberada. Ela preserva a responsabilidade humana sobre o conhecimento consolidado, dá rastreabilidade às sugestões e protege contra a dependência tecnológica, em linha com o que a literatura recomenda para IA generativa em tarefas interpretativas (estudo CHI, 2026; estudo medRxiv, 2024).

### 5.5 Ciclo de ponta a ponta

O fluxo central conecta cadastro assistido por IA, registro de observações, conversa na comunidade e consolidação de aprendizados, com um feed que reflete a atividade. A cobertura de cada projeto frente ao MPO é consultável. Em junho de 2026, o ciclo foi exercitado de ponta a ponta com IA real e dados de simulação, confirmando a viabilidade técnica do artefato.

## 6. Avaliação

### 6.1 Viabilidade técnica

O exercício do ciclo completo com a IA da OpenAI confirmou que as quatro frentes assistivas operam de forma integrada: cadastro, sugestão de observações priorizadas pelos riscos declarados, aceite pelo consultor, alimentação da cobertura, conversa com participação do cliente e atualização do feed. A governança por papel foi confirmada na interface, com o cliente sem acesso a ações de equipe.

### 6.2 Perfil e percepção do piloto

Participaram quatro consultores, com uso atual de Trello (dois dos quatro), planilhas e outra ferramenta; a familiaridade com gestão de projetos era de um participante em nível alto e três em nível médio. A média geral foi 4,48 de 5, com 44 de 48 respostas nas notas 4 ou 5 e 29 de 48 nas notas máximas.

**Tabela 2. Médias por dimensão (escala 1 a 5, N=4).**

| Dimensão | Média | Dimensão | Média |
|---|---|---|---|
| Aprendizados | 5,0 | Usabilidade | 4,5 |
| Governança | 5,0 | Diferenciação | 4,3 |
| Organização | 4,8 | Portfólio | 4,3 |
| Conteúdo | 4,8 | Intenção de uso | 4,3 |
| Comunidade | 4,8 | Ciclo de conhecimento | 4,0 |
| IA assistiva | 4,5 | Clareza | 3,8 |

### 6.3 Achado principal

As dimensões mais bem avaliadas foram governança e aprendizados, ambas com média 5,0, seguidas por organização, conteúdo e comunidade. O padrão é consistente com a tese do trabalho: o valor percebido se concentra no que a comunidade produz e governa, e não nas funcionalidades de IA isoladamente, que receberam 4,5.

### 6.4 Achado contrário

A clareza inicial foi a única dimensão abaixo de 4,0, com média 3,8. As respostas abertas indicaram dúvida sobre o objetivo do sistema e sobre o conceito de comunidades. O achado não aponta uma falha do produto, mas uma lacuna de comunicação na entrada. Como ação corretiva, foi adicionado um onboarding de primeiro acesso, que explica o sistema e o ciclo observação, conversa e aprendizado, com um guia reabrível a qualquer momento.

### 6.5 Evidências qualitativas

As respostas abertas qualificam os números. Como força, um participante destacou que as diversas pontas do trabalho ficam conectadas no mesmo lugar. Como diferencial, foi apontada a conversa em comunidade sobre os projetos. Como alerta, surgiu a dúvida sobre o objetivo e sobre o agrupamento em comunidades. Como melhoria, pediram instruções mais claras e em etapas.

## 7. Discussão

### 7.1 Diálogo com o MPO

Os resultados confirmam o MPO como base válida e mostram que ele é implementável com IA generativa a um custo viável para uma consultoria de pequeno e médio porte. Estudos anteriores avaliaram o modelo conceitualmente e em casos (de Farias Junior et al., 2025); o ObiOne acrescenta a esses uma implementação operacional com LLM, atendendo à primeira lacuna identificada.

### 7.2 IA e comunidade

A IA reduz a fricção de iniciar o ciclo. Sem ela, o consultor precisaria criar observações e aprendizados do zero, o que diminui a adesão ao longo do tempo. À objeção de que a IA criaria dependência tecnológica, o desenho responde com o princípio human-in-the-loop, e os dados respondem com a evidência de que o valor percebido se concentra na comunidade, não na IA. Se a IA fosse removida, o valor principal, governança e aprendizados, permaneceria, ainda que com mais esforço de manutenção.

### 7.3 Implicação prática

Para uma consultoria interessada em adotar algo semelhante, a recomendação é começar pelo ciclo mínimo, observação, conversa e aprendizado, em um ou dois projetos, antes de escalar. A clareza inicial deve ser tratada como prioridade antes de abrir o sistema aos clientes, pois é o principal gargalo de adesão observado.

## 8. Conclusão e Lições Aprendidas

O custo de manter um observatório de projetos caiu com a IA generativa, mas o diferencial de valor é a comunidade, e isso não é substituível por tecnologia. O ObiOne demonstra empiricamente que o MPO é implementável com IA generativa em uma consultoria real, e que a participação de consultoria e clientes em um ciclo comum de conhecimento é o que distingue o observatório de uma ferramenta de gestão.

### 8.1 Lições aprendidas

O trabalho ao longo da disciplina trouxe lições em quatro frentes. No plano operacional, o escopo amplo frente ao prazo exigiu disciplina de cronograma e gestão do trabalho braçal de preparação de dados e de integração contínua das entregas; houve deslizes de data que precisaram ser corrigidos. No plano técnico, os principais desafios foram a integração da IA, a configuração de acesso remoto para validação e a manutenção do ambiente. No plano conceitual, entender o MPO em profundidade e traduzir 44 atributos em uma interface sem jargão foi mais difícil do que implementá-los. No plano de equipe, coordenar quatro integrantes, dividir papéis entre extração, frontend, avaliação e escrita, e integrar o resultado exigiu comunicação constante.

### 8.2 Trabalhos futuros

Três direções se destacam. A primeira é ampliar a validação, com mais participantes e domínios além do marketing. A segunda é avaliar o impacto da IA na qualidade dos aprendizados, e não apenas na redução de fricção, comparando aprendizados consolidados com e sem apoio de IA. A terceira é explorar a síntese cross-projeto, que reconhece padrões entre clientes e ficou fora do escopo deste estudo.

## Declaração de uso de IA

Ferramentas de IA generativa foram usadas como assistente na redação e na organização deste artigo, sob revisão e responsabilidade integral dos autores. No artefato avaliado, o uso de IA está descrito na Seção 5 e segue o princípio human-in-the-loop.

## Disponibilidade de dados

Os dados do piloto de validação (N=4) são reportados de forma agregada por dimensão neste artigo. O código do artefato está sob versionamento no repositório do projeto.

## Referências

de Farias Junior, I. H.; Vieira, J. K. M.; de Moura, H. P.; Sampaio, L. T. A Conceptual Model for Project Observatories. IEEE Access, v. 13, 2025. DOI: 10.1109/ACCESS.2025.3589743.

Henz, P. Knowledge management implementation: A systematic literature review. Knowledge and Process Management, 2024. DOI: 10.1002/kpm.1780.

Hevner, A. R.; March, S. T.; Park, J.; Ram, S. Design Science in Information Systems Research. MIS Quarterly, v. 28, n. 1, p. 75-106, 2004. DOI: 10.2307/25148625.

Kamudyariwa, X. B.; Osobajo, O. A.; Oke, A.; Adebayo, Y. Application of the systemic lessons learned knowledge model to learning in complex projects. 2025. DOI: 10.1177/13505076251339433.

Peffers, K.; Tuunanen, T.; Rothenberger, M. A.; Chatterjee, S. A Design Science Research Methodology for Information Systems Research. Journal of Management Information Systems, v. 24, n. 3, p. 45-77, 2007. DOI: 10.2753/MIS0742-1222240302.

Qualitative Coding Analysis through Open-Source Large Language Models: A User Study and Design Recommendations. CHI Conference on Human Factors in Computing Systems, Extended Abstracts, 2026. DOI: 10.1145/3772363.3798320.

Generative AI for Thematic Analysis in a Maternal Health Study: Coding Semi-structured Interviews using Large Language Models. medRxiv (preprint), 2024. DOI: 10.1101/2024.09.16.24313707.

Vieira, J. K. M. Observatórios de Projetos: Um Modelo Conceitual. Tese (Doutorado em Ciência da Computação), Centro de Informática, Universidade Federal de Pernambuco, Recife, 2022.

Vieira, J. K. M.; de Farias Junior, I. H.; de Moura, H. P. Observatories as Transparency Instruments for Projects. Conferência Ibérica de Sistemas e Tecnologias de Informação (CISTI).

Vieira, J. K. M.; de Farias Junior, I. H.; de Moura, H. P. Utilization of a Conceptual Model in Projects Observatories Development: A Case Study.
