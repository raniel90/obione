# ObiOne: Um Observatório de Projetos Potencializado por Inteligência Artificial Generativa

**Equipe:** Bruno Rocha, Cynthia Oliveira, Moisés Junior, Raniel Silva

**Disciplina:** Tópicos Avançados em Engenharia de Software (TAES) — PPGEC/UPE

---

## Resumo

A promoção da transparência na gestão de projetos tem se mostrado um desafio persistente para as organizações (Nunes *et al.*, 2017). Nesse contexto, os observatórios de projetos emergem como sistemas de informação capazes de apoiar a coleta, o armazenamento, a análise e a disseminação de dados sobre projetos, promovendo transparência e suportando a tomada de decisão (Vieira, 2022). O *Model for Projects Observatories* (MPO), proposto por Farias Jr. *et al.* (2025), oferece um modelo conceitual com 50 conceitos organizados em três dimensões — Estruturas, Processos e Agentes — validado por meio de grupos focais, *survey* com especialistas e estudos de caso. Contudo, a literatura aponta lacunas relevantes: (i) a coleta de dados heterogêneos e não-estruturados permanece como fator crítico que limita a construção de observatórios (Vieira *et al.*, 2021); (ii) os processos de produção de conhecimento e inteligência dependem fortemente de intervenção humana (Vieira *et al.*, 2026); e (iii) todos os estudos empíricos foram conduzidos exclusivamente em contextos acadêmicos e públicos, não havendo validação em organizações privadas com projetos de domínios diversos.

Paralelamente, avanços recentes em *Large Language Models* (LLMs) demonstram sua capacidade de extrair informações estruturadas de documentos não-estruturados com elevada acurácia (Unstract, 2026), bem como sua relevância direta para competências de gestão de projetos (Karnouskos, 2024). Revisões sistemáticas apontam que a IA Generativa pode potencializar a gestão do conhecimento em organizações, automatizando processos de coleta, categorização e disseminação (Nguyen *et al.*, 2025), além de viabilizar sistemas de informação mais transparentes e confiáveis (Kirchner, 2025). Ferramentas de IA para gestão de projetos já são investigadas sob uma perspectiva baseada em conhecimento, abrangendo áreas como escopo, risco, comunicação e *stakeholders* (Alenezi *et al.*, 2025).

Este trabalho propõe o **ObiOne**, um observatório de projetos que utiliza IA Generativa para endereçar a principal lacuna identificada na literatura: a dificuldade de coleta e estruturação de dados de projetos a partir de fontes heterogêneas e não-estruturadas. Adotando o *Design Science Research* (DSR) como método de pesquisa (Hevner *et al.*, 2004), o estudo concentra-se em um ciclo de desenvolvimento e avaliação composto por três etapas: (1) **consciência do problema**, a partir dos *gaps* mapeados nos trabalhos de Vieira (2022; 2025; 2026); (2) **desenvolvimento** de um *pipeline* de extração baseado em LLM que, dado um documento de projeto em formato livre (.docx), identifica e estrutura automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO — Vieira, 2022) — abrangendo informações gerais, *stakeholders*, escopo, cronograma, custos, riscos, mudanças e lições aprendidas — em formato estruturado (JSON), alimentando um *dashboard* de observação do portfólio; e (3) **avaliação** do artefato mediante estudo de caso com cinco projetos reais de domínios distintos (jurídico, saúde, esporte e branding), comparando a extração automática com a manual para verificar a cobertura dos atributos do MPO e a acurácia da IA Generativa.

Espera-se que o ObiOne demonstre como a IA Generativa pode viabilizar a coleta automatizada de dados de projetos a partir de documentos não-estruturados — o desafio mais recorrente reportado na literatura sobre observatórios — reduzindo a dependência de equipes dedicadas e estendendo a aplicabilidade do MPO para contextos organizacionais privados e multissetoriais.

## Referências

- Alenezi, M. *et al.* Artificial intelligence tools for project management: A knowledge-based perspective. *Procedia Computer Science*, 2025.
- Farias Jr., I. H. *et al.* A Conceptual Model for Project Observatories. *IEEE Access*, v. 13, p. 129143–129160, 2025.
- Hevner, A. R. *et al.* Design Science in Information Systems Research. *MIS Quarterly*, v. 28, n. 1, p. 75–105, 2004.
- Karnouskos, S. The Relevance of Large Language Models for Project Management. *IEEE Open J. of the Industrial Electronics Society*, v. 5, 2024.
- Kirchner, K. Generative AI Meets Knowledge Management. *Knowledge and Process Management*, Wiley, 2025.
- Nguyen, T. *et al.* A Systematic Review of Improving Knowledge Management with Generative AI and LLMs. *Journal of Advances in Information Technology*, v. 16, n. 4, 2025.
- Nunes, V.; Cappelli, C.; Ralha, C. G. Transparency in Information Systems. SBC, 2017.
- Vieira, J. K. M. *Observatórios de Projetos: Um Modelo Conceitual*. Tese de Doutorado — CIn/UFPE, 2022.
- Vieira, J. K. M.; Farias Jr., I. H.; Moura, H. P. Observatories as Transparency Instruments for Projects. In: *CISTI*, IEEE, 2021.
- Vieira, J. K. M. *et al.* Utilization of a Conceptual Model in Projects Observatories Development: A Case Study. In: *SBSI*, 2026.
