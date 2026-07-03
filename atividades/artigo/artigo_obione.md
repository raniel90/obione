# ObiOne: um observatório-comunidade de projetos viabilizado por IA Generativa

Bruno Rocha, Cynthia Oliveira, Moisés Júnior, Raniel Silva

Escola Politécnica de Pernambuco — Universidade de Pernambuco (UPE) — Recife — PE — Brasil

Orientador: Prof. Ivaldir Honório de Farias Júnior

{bruno.rocha, cynthia.oliveira, moises.junior, raniel.silva}@upe.br

> **Nota.** Este Markdown é a fonte de conteúdo; a versão canônica no template SBC é gerada por `build_sbc_docx.py` → `Artigo_ObiOne_SBC.docx` / `.pdf`.

## Resumo

Consultorias acumulam conhecimento valioso a cada projeto, mas raramente dispõem de um sistema leve o bastante para preservá-lo e reaproveitá-lo entre clientes. Este artigo apresenta o ObiOne, um observatório-comunidade de projetos construído sobre o Modelo de Observatório de Projetos (MPO) e potencializado por IA Generativa. O trabalho segue a Design Science Research: além de construir o artefato, avalia seu funcionamento real (ciclo exercitado de ponta a ponta com IA da OpenAI) e a percepção de valor em duas rodadas de piloto, com oito consultores no total. No acumulado os resultados foram positivos (média 4,3 de 5); a segunda rodada, após a inclusão de um onboarding e com um público mais diverso, foi mais crítica (4,1 ante 4,48) e manteve a clareza inicial (3,8) como o principal ponto de atenção. A principal contribuição é a demonstração empírica de que o MPO é implementável com IA generativa em uma consultoria real.

## 1. Introdução

Em consultorias, o conhecimento produzido em um projeto tende a ficar com quem o viveu. Lições sobre o que deu certo, riscos que se materializaram e decisões que mudaram o rumo do trabalho raramente são capturadas de forma reaproveitável. Revisões sistemáticas a respeito da gestão do conhecimento mostram que a captura, análise e aplicação de lições aprendidas dependem mais de fatores culturais e organizacionais do que de ferramentas (Henz, 2024; Kamudyariwa et al., 2025). O obstáculo prático é o custo, visto que manter um repositório vivo de conhecimento exige um esforço contínuo que poucas consultorias de pequeno e médio porte conseguem sustentar.

Observatórios de projetos são uma resposta a esse problema. São sistemas de informação que apoiam a coleta, organização, armazenamento, análise e a publicação de observações, promovendo transparência (Vieira et al., 2021). O Modelo de Observatório de Projetos (MPO) consolida essa abordagem em um conjunto de conceitos hierárquicos que orienta a concepção desses sistemas (Vieira, 2022; de Farias Junior et al., 2025).

Diante desse cenário, sobressaem-se duas lacunas principais. A primeira é técnica e empírica: embora o MPO tenha sido validado conceitualmente e em estudos de caso (de Farias Junior et al., 2025), nenhuma implementação conhecida o operacionaliza com IA generativa. A segunda é comunitária: os observatórios descritos na literatura tratam da organização executora, sem explorar a participação do cliente como ator do ciclo de conhecimento. Nesse contexto, a IA generativa surge como uma janela de oportunidade, pois reduz o custo de extrair e sintetizar informação textual.

Ferramentas usuais de gestão de projetos, como quadros de tarefas e painéis, registram o que foi feito, mas não capturam o porquê das decisões nem transformam observações em conhecimento compartilhado; o MPO endereça essa lacuna ao tratar a observação, e não apenas a execução, como objeto de primeira classe.

Alinhado a essa oportunidade, o propósito do observatório é fornecer à consultoria um ambiente intuitivo para observar seus projetos, debater achados e consolidar aprendizados reaproveitáveis. Diante disso, o objetivo deste artigo é investigar como a IA generativa pode viabilizar um observatório-comunidade de projetos, de modo a reduzir a fricção de manutenção e promover o engajamento entre a organização executora e seus clientes. Para isso, o trabalho apresenta o ObiOne, detalhando sua construção e trazendo uma avaliação de uso e percepção.

## 2. Fundamentação Teórica

### 2.1 Observatórios de projetos e o MPO

Observatórios de projetos são sistemas de informação que sistematizam a transparência por meio da observação (Vieira et al., 2021). O MPO é um modelo conceitual para esses observatórios, organizado a partir de conceitos estruturados em três níveis, geral, intermediário e específico (de Farias Junior et al., 2025). Sua versão de tese sistematiza atributos de observação no Quadro 37, abrangendo dimensões que vão de dados estruturais do projeto a registros narrativos como escopo, riscos e lições aprendidas (Vieira, 2022).

### 2.2 Gestão do conhecimento em projetos

A literatura de gestão do conhecimento trata da captura e do reaproveitamento do que se aprende ao longo do trabalho. Revisões recentes apontam que a implementação efetiva depende de cultura, apoio gerencial e melhoria contínua (Henz, 2024), e que em projetos complexos a aprendizagem se sustenta quando a captura, análise e a aplicação de lições são sistemáticas (Kamudyariwa et al., 2025).

### 2.3 IA Generativa como assistente

Modelos de linguagem têm sido estudados como apoio à análise textual. Estudos recentes mostram que a IA acelera a identificação de temas descritivos e reduz o esforço operacional, mas perde nuances que dependem de conhecimento contextual humano (CHI, 2026; medRxiv, 2024). O consenso emergente é o de uma parceria guiada, em que o humano permanece como líder intelectual, princípio conhecido como human-in-the-loop.

## 3. Método

### 3.1 Design Science Research

A construção do ObiOne segue a Design Science Research, que estabelece o artefato como forma legítima de pesquisa (Hevner et al., 2004) e organiza o trabalho em atividades de identificação do problema, definição de objetivos, design e desenvolvimento, demonstração, avaliação e comunicação (Peffers et al., 2007). Por se tratar de uma pergunta de viabilidade, responder exige construir o sistema, colocá-lo em uso e observar o resultado, e não apenas coletar opiniões sobre uma descrição.

### 3.2 Desenho da avaliação

A avaliação combinou a demonstração de uso real do artefato com a medição da percepção de valor. A percepção foi medida por um instrumento de doze afirmações em escala Likert de 1 a 5 e três perguntas abertas, aplicado em duas rodadas de piloto com quatro consultores cada, após um walkthrough do sistema. A segunda rodada ocorreu depois da inclusão de um onboarding de primeiro acesso e reuniu um público mais diverso. Como as duas rodadas usaram participantes distintos, a comparação é exploratória e carrega um confundidor: a variação entre rodadas mistura o efeito das mudanças no produto com a diferença de composição das coortes. A avaliação foi conduzida na perspectiva do consultor, perfil central do observatório; a aplicação, porém, oferece telas para os três perfis, consultor, administrador e cliente, conforme o Apêndice C. Os resultados são reportados como casos, sem inferência estatística.

### 3.3 Participantes

As duas rodadas somaram oito participantes de uma mesma consultoria, quatro em cada rodada. Quanto ao papel, sete eram consultores e um era gestor. As ferramentas de acompanhamento de projetos usadas no dia a dia eram sobretudo o Trello, por quatro participantes, e planilhas, por três. A familiaridade com gestão de projetos era, na maioria, de nível médio. A Tabela 1 resume o perfil.

**Tabela 1. Perfil dos participantes (N=8, duas rodadas de quatro).**

| Dimensão | Distribuição |
|---|---|
| Rodadas | 4 na primeira; 4 na segunda |
| Papel | 7 consultores; 1 gestor |
| Ferramenta de projetos usada hoje | 4 Trello; 3 planilhas; 1 outra |
| Familiaridade com gestão de projetos | 2 alto; 5 médio; 1 baixo |

## 4. Implementação

### 4.1 Requisitos e rastreabilidade ao MPO

O ObiOne foi desenvolvido para uma consultoria de marketing, que atua como organização executora e curadora, e seus clientes, que acessam cada um o próprio projeto. A elicitação e a especificação seguiram práticas usuais de engenharia de requisitos (Sommerville, 2016), e cada requisito funcional foi ancorado a uma característica ou processo do MPO, de modo que o artefato implementasse o modelo, e não apenas se inspirasse nele. A Tabela 2 apresenta uma amostra; a rastreabilidade completa está no Apêndice A.

**Tabela 2. Amostra da rastreabilidade requisito -> MPO -> implementação.**

| Requisito (ObiOne) | Âncora no MPO | Implementação |
|---|---|---|
| Catálogo de atributos de observação | Quadro 37: 44 atributos em 8 dimensões (Vieira, 2022) | mpo/MpoCatalog |
| Cobertura de observação por projeto | Característica Abrangência (Vieira, 2022) | GET /projects/{id}/coverage |
| Governança de acesso por papel | Característica Segurança (Vieira, 2022) | filtro por papel (consultor/cliente) |
| Registro e acompanhamento | Processos Acompanhar e Avaliar (Vieira, 2022) | ciclo observação -> conversa -> aprendizado |
| Consolidação de aprendizados | Transparência e disseminação (de Farias Junior et al., 2025) | comunidade por domínio |

A cobertura resultante abrange os 44 atributos do Quadro 37 em 8 dimensões. Trata-se de cobertura arquitetural: o sistema provê os campos e os fluxos correspondentes. A avaliação empírica da qualidade da extração é uma frente prevista no protocolo, ainda não executada (Seção 5.4).

### 4.2 Arquitetura

O ObiOne é uma aplicação web dividida em backend e frontend. O backend usa Java 21 e Spring Boot, com os módulos web, data-jpa, security e validation, e segue uma organização por contexto de domínio em camadas: controladores REST finos, serviços com a lógica de negócio, repositórios Spring Data, entidades JPA e objetos de transferência de dados com mapeadores dedicados. A persistência de desenvolvimento usa um banco H2 em arquivo, com PostgreSQL previsto para produção. O frontend usa React com TanStack Start e roteamento baseado em arquivos, construído com Vite; o estado de servidor é gerido por react-query e os formulários por react-hook-form com validação por esquema. A API responde sob o caminho base barra-api, e a aplicação adota um padrão de origem única: o servidor de desenvolvimento serve a interface e encaminha as chamadas de API ao backend, o que simplifica o acesso remoto para as sessões de validação.

### 4.3 Camada de IA

A camada de IA é o principal diferencial do ObiOne e atua de forma assistiva sobre o ciclo de observação, conversa e aprendizado. Está organizada em cinco papéis; em todos, a saída é uma sugestão, nunca uma ação publicada automaticamente. A Tabela 3 resume os papéis, com suas entradas e saídas.

**Tabela 3. Papéis da camada de IA, com entradas e saídas.**

| Papel | Função | Entrada | Saída |
|---|---|---|---|
| Categorizadora | Sugere o domínio do projeto | resumo, objetivo, domínios disponíveis | domínio sugerido e confiança |
| Observadora | Sugere observações ancoradas no MPO | resumo, objetivo, lente MPO, atributos prioritários | observações mapeadas a atributos, com impacto e trecho literal |
| Sintetizadora | Rascunha um aprendizado a partir da conversa | título, pergunta, contribuições | rascunho com resumo, evidência e recomendação |
| Conectora | Sintetiza padrões entre projetos do domínio (implementada; não avaliada) | resumos dos projetos do domínio | padrões e lições anonimizados |
| Configuradora | Sugere o setup inicial no cadastro | nome, descrição, objetivo | domínio, atributos e fenômenos esperados |

O processamento de um projeto segue um fluxo comum. A partir do texto do projeto, o serviço assistente monta o contexto e injeta a lente do MPO, isto é, a lista dos 44 atributos do Quadro 37; aciona o provedor de IA, que devolve uma saída estruturada; registra a sugestão com sua proveniência; e a devolve ao consultor para revisão. A Figura 1 ilustra esse fluxo.

**Figura 1. Pipeline da camada de IA.**

`Descrição do projeto → Contexto + lente MPO (44 atributos) → Provedor de IA (mock ou OpenAI; saída estruturada) → Registro em ai_suggestion_logs (proveniência) → Revisão do consultor → Observação ou aprendizado`

Três técnicas sustentam a confiabilidade das sugestões. A primeira é a saída estruturada: o modelo é obrigado a responder no formato de um objeto de dados, que o sistema mapeia diretamente, sem interpretação livre do texto. A segunda é o grounding pela lente do MPO, reforçado por instruções que orientam o modelo a não inventar atributos fora da lista fornecida e a citar o trecho literal do resumo que motivou cada observação. A terceira é uma validação determinística em código: na configuração inicial de um projeto, identificadores de atributo ou de domínio inexistentes no catálogo são descartados antes de a resposta ser devolvida; nos demais papéis, essa restrição é reforçada pelas instruções do prompt. O provedor é configurável: um modo determinístico, sem chave e voltado a testes, e o provedor da OpenAI, com o modelo gpt-4o-mini e temperatura baixa, para uso real.

A IA nunca escreve diretamente nas observações ou nos aprendizados. Ela apenas sugere e registra cada sugestão em um log de auditoria, com o provedor, o modelo, o instante e a indicação de aceite, o que dá reprodutibilidade ao uso da IA. A persistência só ocorre quando o consultor aceita a sugestão, e a observação é então gravada com a origem marcada como assistida pela IA. A taxa de aceite por tipo de sugestão é observável no sistema, permitindo acompanhar o quanto as sugestões são de fato aproveitadas.

### 4.4 Prototipação

Antes do desenvolvimento final, as telas foram prototipadas com apoio de ferramentas de geração assistida por IA no ecossistema React, incluindo o Lovable, que produziu o scaffold inicial da interface e da sua configuração de build. A prototipação rápida corresponde à atividade de design e desenvolvimento da Design Science Research e serviu de insumo concreto para as validações com os orientadores, encurtando o ciclo entre uma ideia de tela e uma versão navegável.

### 4.5 Governança por papel

O acesso ao observatório é semi-aberto e governado pelo papel do usuário. As leituras exigem autenticação; as mutações são restritas aos papéis de consultor e administrador, enquanto o cliente contribui nas conversas e enxerga apenas o seu próprio projeto. O consultor conduz a curadoria e vê todo o portfólio; o administrador acumula as permissões de gestão; o cliente participa da comunidade do seu caso sem acesso às ações de equipe nem à visão consolidada do portfólio. Esse arranjo garante o isolamento entre clientes e materializa, na prática, o acesso semi-aberto previsto no MPO. As telas correspondentes a cada perfil estão no Apêndice C.

### 4.6 Jornada do usuário e construção do MVP

A jornada central percorre quatro momentos: o cadastro de um projeto assistido por um wizard com apoio de IA, o registro de observações ancoradas no MPO, a conversa da comunidade sobre essas observações e a consolidação de aprendizados reaproveitáveis. Um feed reflete a atividade recente e a cobertura de cada projeto frente ao MPO é consultável. O MVP foi construído em torno desse fluxo e entregou o cadastro com extração assistida, a organização da comunidade por domínio, o detalhe do projeto com os atributos do MPO, a consolidação de aprendizados com apoio da Sintetizadora, o feed de novidades e, após a primeira rodada de validação, um onboarding de primeiro acesso que apresenta o objetivo do sistema e o ciclo de conhecimento.

## 5. Resultados

### 5.1 Viabilidade técnica

Em junho de 2026, o ciclo foi exercitado de ponta a ponta com a IA da OpenAI e dados de simulação. As quatro frentes assistivas operaram de forma integrada: cadastro, sugestão de observações priorizadas pelos riscos declarados, aceite pelo consultor, alimentação da cobertura, conversa com participação do cliente e atualização do feed. A governança por papel foi confirmada na interface.

### 5.2 Percepção de valor

A percepção de valor foi medida em duas rodadas de piloto com quatro consultores cada, aplicando o mesmo instrumento de doze afirmações Likert e três perguntas abertas. A primeira rodada ocorreu após um walkthrough curto; a segunda, após a inclusão de um onboarding de primeiro acesso e outros ajustes, com um público mais diverso (incluindo um gestor e mais usuários de planilhas). A primeira rodada obteve média 4,48 de 5, com 44 de 48 respostas nas notas 4 ou 5 e 29 máximas. A segunda foi mais crítica: média 4,1, com 36 de 48 respostas positivas e 19 máximas. No acumulado dos oito participantes, a média foi 4,3 de 5, com 80 de 96 respostas positivas. A Tabela 4 apresenta o comparativo por dimensão entre as duas rodadas.

**Tabela 4. Médias por dimensão nas duas rodadas (escala 1 a 5, N=4 por rodada).**

| Dimensão | 1ª rodada | 2ª rodada | Δ |
|---|---|---|---|
| Clareza | 3,8 | 3,8 | 0,0 |
| Organização | 4,8 | 4,0 | -0,8 |
| Usabilidade | 4,5 | 4,5 | 0,0 |
| Conteúdo | 4,8 | 4,8 | 0,0 |
| Diferenciação | 4,2 | 3,8 | -0,5 |
| Ciclo de conhecimento | 4,0 | 4,2 | +0,2 |
| Comunidade | 4,8 | 4,3 | -0,5 |
| Aprendizados | 5,0 | 4,2 | -0,8 |
| IA assistiva | 4,5 | 4,0 | -0,5 |
| Portfólio | 4,2 | 4,2 | 0,0 |
| Governança | 5,0 | 3,8 | -1,2 |
| Intenção de uso | 4,2 | 4,0 | -0,2 |

A segunda rodada leu o produto de forma mais crítica em governança (-1,2), organização e aprendizados (-0,8 cada), comunidade, diferenciação e IA assistiva (-0,5 cada). Conteúdo, usabilidade, portfólio e, notadamente, a clareza permaneceram estáveis, e o ciclo de conhecimento evoluiu (+0,2). A queda é atribuída, em parte, a um público mais diverso e crítico e, em parte, à fricção inicial que persiste: isolar o efeito do onboarding exigiria um desenho controlado com os mesmos usuários antes e depois. Ainda assim, o valor central se manteve nas respostas abertas, em que a IA passou a aparecer como força ("aprendizado consolidado através da IA") e o produto foi descrito como amigável e que integra tecnologia e educação. O feedback crítico, por sua vez, concentrou-se na experiência inicial: um participante relatou que "ficou um pouco confusa a explicação sobre algumas funcionalidades", e os pedidos de melhoria convergiram para "navegação mais intuitiva, instruções mais claras e interface mais simples".

### 5.3 Benefícios esperados

Os benefícios esperados com a solução incluem a redução do custo de manutenção do conhecimento entre projetos, o fortalecimento do relacionamento com os clientes por meio de maior engajamento e comunicação na comunidade, e o reaproveitamento de aprendizados já consolidados em novos projetos do mesmo domínio.

### 5.4 Limitações

As duas rodadas somam oito participantes de uma mesma consultoria, em ciclos distintos e com composição diferente; os resultados são reportados como casos, sem inferência estatística, e a comparação entre rodadas é exploratória. A clareza permaneceu como o principal ponto de atenção (3,8 nas duas rodadas): a inclusão de um onboarding de primeiro acesso não moveu esse indicador, o que sugere que a orientação inicial precisa ir além de um passo introdutório, na direção de uma navegação mais guiada. Como a segunda rodada usou participantes distintos, não é possível separar o efeito do onboarding da mudança de público. Por fim, a avaliação da qualidade da extração dos atributos do MPO, prevista no protocolo, ainda não foi executada.

## 6. Discussões e Lições Aprendidas

Os resultados confirmam o MPO como base válida e mostram que ele é implementável com IA generativa a um custo viável para uma consultoria de pequeno e médio porte. Estudos anteriores avaliaram o modelo conceitualmente e em casos (de Farias Junior et al., 2025); o ObiOne acrescenta uma implementação operacional com IA. A IA reduz a fricção de iniciar o ciclo; à objeção de que criaria dependência, o desenho responde com o human-in-the-loop, e as respostas abertas sustentam que o valor percebido está no que a comunidade produz e no aprendizado consolidado com apoio da IA. A segunda rodada, mais crítica, deixa claro que a restrição dominante para a adoção não está no ciclo em si, mas na experiência inicial: enquanto a clareza e a navegação não forem resolvidas, o valor demora a ser percebido. O fato de o onboarding não ter movido a clareza indica que o próximo passo é uma navegação guiada, com menu evidente, fluxo em etapas e exemplos práticos.

Como decisões arquiteturais, destacam-se a IA estritamente assistiva e a governança por papel, que viabiliza o acesso semi-aberto com isolamento entre clientes. Entre vantagens e limitações das ferramentas, o desenvolvimento em código deu controle sobre o pipeline e a governança, ao custo de mais esforço do que uma abordagem low-code. A experiência de uso do MPO mostrou que traduzir 44 atributos em uma interface sem jargão é mais difícil do que implementá-los.

A lição mais marcante foi de escopo. O projeto passou por um pivô: a proposta inicial foi reescopada para refinar o propósito da solução, deslocando o foco de um extrator de atributos para um observatório-comunidade. Esse refino exigiu bastante trabalho ao longo de várias validações com os orientadores, e foi ele, mais do que qualquer ganho de ferramenta, que destravou o valor percebido. A IA generativa acelerou a construção, mas mostrou um limite claro: sem uma definição nítida do que se está construindo, a velocidade da IA não leva a lugar nenhum; ela amplifica a direção que já existe, não a substitui.

Amarradas a essa jornada, as lições de equipe se somam às de escopo. No plano operacional, o escopo amplo frente ao prazo exigiu disciplina de cronograma e trabalho de preparação de dados e integração contínua, com deslizes de data corrigidos ao longo do projeto. No plano técnico, os principais desafios foram a integração da IA, a configuração de acesso remoto para validação e a manutenção do ambiente. No plano conceitual, entender o MPO em profundidade foi determinante. No plano de equipe, coordenar quatro integrantes e integrar frentes de extração, frontend, avaliação e escrita exigiu comunicação constante.

## 7. Conclusão

O custo de manter um observatório de projetos caiu com a IA generativa, mas o diferencial de valor é a comunidade, e isso não é substituível por tecnologia. Como síntese da experiência, o ObiOne demonstra empiricamente que o MPO é implementável com IA generativa em uma consultoria real, e que a participação de consultoria e clientes em um ciclo comum de conhecimento distingue o observatório de uma ferramenta de gestão. A principal contribuição é essa demonstração empírica.

### Questões em aberto

A leitura comparativa das duas rodadas deixa cinco questões que delimitam os gaps da pesquisa e orientam sua continuidade: (1) o onboarding melhora a clareza quando medido nos mesmos usuários antes e depois, isolando o efeito da mudança de público? (2) uma navegação guiada, com menu evidente, fluxo em etapas e exemplos práticos, eleva a clareza acima do patamar observado de 3,8? (3) qual a acurácia e a fidelidade da extração dos atributos do MPO pela IA, conforme o protocolo ainda não executado? (4) a IA melhora a qualidade dos aprendizados consolidados, e não apenas reduz a fricção de iniciar o ciclo? (5) o padrão de valor percebido se mantém em outros domínios, com amostra maior e uso prolongado, e o que explica a queda na percepção de governança na segunda rodada?

Essas questões orientam os trabalhos futuros: realizar uma nova rodada controlada, com os mesmos usuários antes e depois de uma navegação guiada; ampliar a validação com mais participantes e domínios; executar o protocolo de avaliação da extração do MPO; e avaliar a síntese cross-projeto (Conectora), já implementada com mitigações de anonimização e gate de publicação, cuja avaliação de valor permanece em aberto.

## Referências

de Farias Junior, I. H., Vieira, J. K. M., de Moura, H. P. and Sampaio, L. T. (2025) "A Conceptual Model for Project Observatories", IEEE Access, v. 13. DOI: 10.1109/ACCESS.2025.3589743.

Henz, P. (2024) "Knowledge management implementation: A systematic literature review", Knowledge and Process Management. DOI: 10.1002/kpm.1780.

Hevner, A. R., March, S. T., Park, J. and Ram, S. (2004) "Design Science in Information Systems Research", MIS Quarterly, v. 28, n. 1, p. 75-106. DOI: 10.2307/25148625.

Kamudyariwa, X. B., Osobajo, O. A., Oke, A. and Adebayo, Y. (2025) "Application of the systemic lessons learned knowledge model to learning in complex projects". DOI: 10.1177/13505076251339433.

Peffers, K., Tuunanen, T., Rothenberger, M. A. and Chatterjee, S. (2007) "A Design Science Research Methodology for Information Systems Research", Journal of Management Information Systems, v. 24, n. 3, p. 45-77. DOI: 10.2753/MIS0742-1222240302.

Sommerville, I. (2016) "Software Engineering", 10ª ed., Pearson Education, Boston.

"Generative AI for Thematic Analysis in a Maternal Health Study: Coding Semi-structured Interviews using Large Language Models" (2024), medRxiv (preprint). DOI: 10.1101/2024.09.16.24313707.

"Qualitative Coding Analysis through Open-Source Large Language Models: A User Study and Design Recommendations" (2026), In: CHI Conference on Human Factors in Computing Systems, Extended Abstracts. DOI: 10.1145/3772363.3798320.

Vieira, J. K. M. (2022) "Observatórios de Projetos: Um Modelo Conceitual", Tese de Doutorado, Centro de Informática, Universidade Federal de Pernambuco, Recife.

Vieira, J. K. M., de Farias Junior, I. H. and de Moura, H. P. (2021) "Observatories as Transparency Instruments for Projects", In: 16ª Conferência Ibérica de Sistemas e Tecnologias de Informação (CISTI).

## Apêndices

### Apêndice A - Requisitos e rastreabilidade ao MPO

A Tabela A.1 relaciona os principais requisitos funcionais do ObiOne às características e processos do MPO (Vieira, 2022) e à sua materialização no sistema. A especificação completa dos requisitos está no repositório.

**Tabela A.1. Rastreabilidade dos requisitos funcionais ao MPO.**

| RF | Requisito | Âncora no MPO (Vieira, 2022) | Implementação |
|---|---|---|---|
| RF01 | Autenticar usuário | Segurança (p. 192) | auth por token; SecurityConfig |
| RF02 | Perfis e acesso semi-aberto | Acesso semi-aberto (p. 189); agentes (pp. 200-201) | papéis consultor/admin/cliente |
| RF03 | Cadastrar projeto (descrição textual) | Coletar (p. 195) | wizard de cadastro |
| RF04 | Governança de visibilidade por papel | Acesso semi-aberto (p. 189); Segurança (p. 192) | enforcement por papel |
| RF05 | Extrair atributos do MPO via IA | Quadro 37 (p. 264); Transformar (p. 196) | camada de IA (Observadora) |
| RF06 | Persistir extração estruturada | Armazenar (p. 196) | entidades JPA |
| RF07 | Portfólio perfil-aware | Abrangência (p. 189); Disponibilizar (p. 196) | listagem por papel |
| RF08 | Detalhe do projeto | Projetos (p. 186); Disponibilizar (p. 196) | detalhe com atributos MPO |
| RF09 | Cobertura do MPO | Abrangência (p. 189); Avaliar (p. 198) | GET /projects/{id}/coverage |
| RF10 | Comentar/conversar no projeto | Interatividade (p. 191); Interagir (p. 198) | discussões da comunidade |
| RF11 | Feed de novidades | Acompanhar (p. 198) | feed temporal in-app |
| RF12 | Consolidar aprendizados (IA) | Transformar; Categorizar (pp. 196-197) | camada de IA (Sintetizadora) |
| RF13 | Categorizar por temática/domínio | Categorizar/Classificar (pp. 196-197) | camada de IA (Configuradora) |

[Repositório](https://github.com/raniel90/obione)

[Especificação de requisitos](https://github.com/raniel90/obione/blob/main/atividades/requisitos.md)

### Apêndice B - Arquitetura do Observatório

A arquitetura em camadas do backend, com controladores, serviços, repositórios, entidades e mapeadores, e o pipeline da camada de IA estão descritos em detalhe nos documentos de arquitetura do repositório, listados a seguir.

[Arquitetura do backend](https://github.com/raniel90/obione/blob/main/atividades/arquitetura_backend.md)

[Pipeline da camada de IA](https://github.com/raniel90/obione/blob/main/atividades/arquitetura_pipeline.md)

[Diagrama da arquitetura](https://github.com/raniel90/obione/blob/main/atividades/arquitetura_diagrama.md)

### Apêndice C - Telas por perfil

A Tabela C.1 resume quais perfis acessam cada tela; em seguida, as Figuras C.1 a C.6 ilustram as telas principais. O conjunto completo de telas está em Principais_Telas_ObiOne.pdf, no repositório.

**Tabela C.1. Telas e perfis que as acessam.**

| Tela | Consultor | Administrador | Cliente |
|---|---|---|---|
| Observatório (home) | sim | sim | visão limitada |
| Comunidade | sim | sim | sim (seu domínio) |
| Detalhe do projeto | sim (todos atributos) | sim | sim (seu projeto) |
| Feed de novidades | sim | sim | sim |
| Consolidar com IA | sim | sim | não |
| Wizard de cadastro | sim | sim | não |

- Figura C.1. Observatório (home). (`atividades/apresentacoes/prints/01-home.png`)
- Figura C.2. Comunidade. (`atividades/apresentacoes/prints/02-comunidade.png`)
- Figura C.3. Detalhe do projeto. (`atividades/apresentacoes/prints/03-detalhe-projeto.png`)
- Figura C.4. Feed de novidades. (`atividades/apresentacoes/prints/04-feed.png`)
- Figura C.5. Consolidar aprendizado com IA. (`atividades/apresentacoes/prints/05-consolidar-ia.png`)
- Figura C.6. Wizard de cadastro de projeto. (`atividades/apresentacoes/prints/06-wizard.png`)

[Telas completas](https://github.com/raniel90/obione/blob/main/atividades/Principais_Telas_ObiOne.pdf)
