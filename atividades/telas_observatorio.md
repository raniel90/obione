# Principais Telas do Observatório

O ObiOne é um observatório inteligente de projetos para consultorias: uma consultoria observa seu universo de clientes, projetos e domínios temáticos, com curadoria de acesso semiaberto. Este documento apresenta as telas principais do frontend (primeira entrega) e os fundamentos de design da interface. Cada tela é relacionada aos requisitos e aos conceitos do MPO que materializa.

## 1. Tela de Acesso

![Tela de acesso: login por e-mail corporativo e senha, com a proposta "Observar. Organizar. Decidir."](/Users/raniel/Documents/gitworkspace/phd/taes/obione/atividades/telas/login.jpeg)

Porta de entrada do observatório. Acesso por e-mail corporativo e senha, sem cadastro público (as contas são criadas pela consultoria), reforçando o modelo de acesso semiaberto. A proposta de valor "Observar. Organizar. Decidir." comunica o propósito da plataforma logo na entrada.

- **Requisitos:** RF01 (autenticar usuário), RF02 (perfis e acesso semiaberto).
- **MPO:** características Segurança e Acesso semiaberto.

## 2. Observatório de Projetos

![Observatório de Projetos: indicadores agregados no topo, filtros por status e domínio, e cards de projeto com progresso, tags, responsável e status](/Users/raniel/Documents/gitworkspace/phd/taes/obione/atividades/telas/projetos.jpeg)

Visão geral do portfólio monitorado. No topo, indicadores agregados (projetos monitorados, em execução, domínios observados e concluídos no ciclo). Abaixo, filtros por status e por domínio, e cards de projeto com barra de progresso, tags, responsável e status colorido, permitindo escanear rapidamente o estado de cada projeto.

- **Requisitos:** RF07 (portfólio perfil-aware), RF09 (cobertura e indicadores), RF20 (cockpit comparativo cross-projeto).
- **MPO:** característica Abrangência; processos Visualizar, Acompanhar e Disponibilizar.

## 3. Domínios

![Domínios: núcleos de observação que organizam os projetos por área estratégica, com a contagem de projetos por domínio](/Users/raniel/Documents/gitworkspace/phd/taes/obione/atividades/telas/dominios.jpeg)

Núcleos de observação que organizam os projetos por área estratégica e contexto analítico: Marketing Estratégico, Branding, Pesquisa de Mercado, Comunicação Digital, Gestão Comercial e Projetos Acadêmicos, cada domínio com a contagem de projetos. O domínio é a temática do projeto no vocabulário do MPO, base do agrupamento e da comparação cross-projeto.

- **Requisitos:** RF19 (categorizar por temática/segmento), RF20 (agrupamento e comparação por temática).
- **MPO:** conteúdo Temáticas dos Projetos; processo Categorizar/Classificar.

## 4. Identidade Visual e Design System

![Definições de design do ObiOne: identidade visual, design tokens e princípios de UX](/Users/raniel/Documents/gitworkspace/phd/taes/obione/atividades/telas/definicoes.png)

Fundamentos de design que garantem consistência entre as telas: identidade minimalista e tecnológica inspirada em plataformas modernas de analytics e observabilidade, design tokens (cores, tipografia e componentes base) e princípios de UX (escaneabilidade visual, hierarquia clara e foco em produtividade). É o que faz o frontend parecer um produto real de inteligência organizacional, não um protótipo acadêmico.

- **Requisitos:** RNF02 (usabilidade).
- **MPO:** característica Usabilidade.
