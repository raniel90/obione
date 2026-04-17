# Orion: Um Observatório de Projetos Potencializado por Inteligência Artificial Generativa

**Equipe:** Bruno Rocha, Cynthia Oliveira, Moisés Junior, Raniel Silva

**Disciplina:** Tópicos Avançados em Engenharia de Software (TAES) — PPGEC/UPE

---

## Resumo

A promoção da transparência na gestão de projetos tem se mostrado um desafio persistente para as organizações (Nunes *et al.*, 2017). Nesse contexto, os observatórios de projetos emergem como sistemas de informação capazes de apoiar a coleta, o armazenamento, a análise e a disseminação de dados sobre projetos, promovendo transparência e suportando a tomada de decisão (Vieira, 2022). O *Model for Projects Observatories* (MPO), proposto por Vieira *et al.* (2025), oferece um modelo conceitual com 50 conceitos organizados em três dimensões — Estruturas, Processos e Agentes — validado por meio de grupos focais, *survey* com especialistas e estudos de caso. Contudo, a literatura aponta lacunas relevantes: (i) a coleta de dados heterogêneos e não-estruturados permanece como fator crítico que limita a construção de observatórios (Vieira *et al.*, 2021); (ii) os processos de produção de conhecimento e inteligência dependem fortemente de intervenção humana (Vieira *et al.*, 2026); e (iii) todos os estudos empíricos foram conduzidos exclusivamente em contextos acadêmicos e públicos, não havendo validação em organizações privadas com projetos de domínios diversos.

Paralelamente, avanços recentes em *Large Language Models* (LLMs) demonstram sua capacidade de extrair informações estruturadas de documentos não-estruturados com elevada acurácia (Unstract, 2026), bem como sua relevância direta para competências de gestão de projetos (Karnouskos, 2024). Revisões sistemáticas apontam que a IA Generativa pode potencializar a gestão do conhecimento em organizações, automatizando processos de coleta, categorização e disseminação (Nguyen *et al.*, 2025), além de viabilizar sistemas de informação mais transparentes e confiáveis (Kirchner, 2025). Ferramentas de IA para gestão de projetos já são investigadas sob uma perspectiva baseada em conhecimento, abrangendo áreas como escopo, risco, comunicação e *stakeholders* (ScienceDirect, 2025).

Este trabalho propõe o **Orion**, um observatório de projetos que integra IA Generativa ao MPO para endereçar as lacunas identificadas. Adotando o *Design Science Research* (DSR) como método de pesquisa (Hevner *et al.*, 2004), o estudo contempla os ciclos de: (1) **consciência do problema**, a partir dos *gaps* mapeados nos trabalhos de Vieira (2022; 2025; 2026); (2) **sugestão e desenvolvimento** do artefato — um protótipo de observatório que utiliza LLMs para extração automática de entidades de documentos de projetos (.docx), normalização e padronização de dados heterogêneos, classificação temática por similaridade semântica, geração de análises *cross-project* e relatórios automatizados, e interface conversacional para consulta em linguagem natural; e (3) **avaliação** do artefato mediante estudo de caso com um portfólio real de cinco projetos privados de domínios distintos (jurídico, saúde, esporte e branding), avaliando a cobertura dos conceitos do MPO e a contribuição da IA Generativa para os processos do observatório. Os projetos do estudo de caso envolvem dados sensíveis, dados parciais e requisitos de LGPD, permitindo também avaliar aspectos de governança e segurança previstos no modelo.

Espera-se que o Orion demonstre como a IA Generativa pode: (a) viabilizar a coleta automatizada de dados de projetos a partir de fontes não-estruturadas; (b) reduzir a dependência de equipes dedicadas nos processos de análise e disseminação; (c) ampliar a interatividade e usabilidade do observatório; e (d) estender a aplicabilidade do MPO para contextos organizacionais privados e multissetoriais, contribuindo para a evolução do modelo e da pesquisa em observatórios de projetos.

## Referências

- Hevner, A. R. *et al.* Design Science in Information Systems Research. *MIS Quarterly*, v. 28, n. 1, p. 75–105, 2004.
- Karnouskos, S. The Relevance of Large Language Models for Project Management. *IEEE Open Journal of the Industrial Electronics Society*, v. 5, 2024.
- Kirchner, K. Generative AI Meets Knowledge Management: Insights From Software Development Practices. *Knowledge and Process Management*, 2025.
- Nguyen, T. *et al.* A Systematic Review of Improving Knowledge Management with Generative AI and LLMs. *Journal of Advances in Information Technology*, v. 16, n. 4, 2025.
- Nunes, V.; Cappelli, C.; Ralha, C. G. Transparency in Information Systems. SBC, 2017.
- Vieira, J. K. M. *Observatórios de Projetos: Um Modelo Conceitual*. Tese de Doutorado — CIn/UFPE, 2022.
- Vieira, J. K. M.; Farias Jr., I. H.; Moura, H. P. Observatories as Transparency Instruments for Projects. In: *CISTI*, IEEE, 2021.
- Vieira, J. K. M. *et al.* Utilization of a Conceptual Model in Projects Observatories Development: A Case Study. In: *SBSI*, 2026.
- Farias Jr., I. H. *et al.* A Conceptual Model for Project Observatories. *IEEE Access*, v. 13, p. 129143–129160, 2025.
