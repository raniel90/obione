# ObiOne: Detalhamento Metodológico

## 1. Método: Design Science Research (DSR)

Baseado em Hevner *et al.* (2004), o estudo segue um ciclo único de DSR com três etapas.

## 2. Etapas

### 2.1 Consciência do problema (semanas 1-2)

- Análise dos gaps nos papers de referência (Vieira 2021, 2025, 2026)
- Definição dos atributos-alvo com base no **Quadro 37 (terceira versão do MPO — Vieira, 2022)**, abrangendo as 8 categorias de atributos de projetos: geral, stakeholders, escopo, cronograma, custos, riscos, mudanças e lições aprendidas
- Categorização de cada atributo como `estruturado` (datas, valores, status) ou `texto_livre` (escopo, riscos narrativos, lições, etc.); atributos não-textuais (imagens/fotos) ficam fora do escopo do pipeline LLM
- Definição do protocolo de avaliação híbrido (ver seção 2.3)
- **Produção do gabarito manual** dos 5 projetos por dois avaliadores independentes — baseline para a comparação na seção 2.3. Valença Odontologia (complexidade Baixa) é anotada primeiro como piloto, calibrando a rubrica antes dos demais projetos

### 2.2 Desenvolvimento do artefato (semanas 3-8)

**Pipeline de extração LLM:**
- Entrada: documento de projeto em formato livre (.docx)
- Processamento: LLM extrai atributos do MPO via prompt estruturado
- Saída: JSON com atributos normalizados (nome, escopo, cronograma, orçamento, stakeholders, riscos, lições aprendidas, etc.)

**Dashboard de observação (Streamlit ou similar):**
- Visualização do portfólio com dados extraídos
- Visão consolidada dos 5 projetos
- Indicadores básicos: status, atrasos, cobertura de atributos

### 2.3 Avaliação do artefato (semanas 9-10)

Estudo de caso com 5 projetos reais de domínios distintos (jurídico, saúde, esporte, branding).

#### Perspectiva quantitativa

Extração manual como baseline (gabarito), comparada com extração automática do LLM. Adota-se um **critério híbrido de match**:

- **Atributos `estruturado`** (datas, valores, status, nomes próprios formais): comparação normalizada exata; cálculo binário de TP/FP/FN.
- **Atributos `texto_livre`** (escopo, riscos, lições, etc.): rubrica humana 0 / 0,5 / 1 aplicada por dois avaliadores independentes; concordância reportada via Cohen's Kappa.

| Métrica | Fórmula | O que mede |
|---|---|---|
| Cobertura | atributos preenchidos / total de atributos-alvo (Quadro 37) | Abrangência da extração frente ao MPO |
| Precisão | atributos corretos / atributos extraídos | Confiabilidade da extração |
| Recall | atributos encontrados / atributos existentes no doc | Completude da extração |
| F1-Score | 2 × (Precisão × Recall) / (Precisão + Recall) | Equilíbrio precisão/recall |
| Kappa | concordância entre avaliadores (texto_livre) | Confiabilidade da rubrica |
| Tempo | minutos por projeto (manual vs. automático) | Ganho de eficiência |

Métricas reportadas separadamente para o grupo `estruturado` e `texto_livre`, mais agregado total.

#### Perspectiva qualitativa

Questionário breve (escala Likert 1-5) aplicado a stakeholders dos projetos.

Dimensões avaliadas:
- **Utilidade**: o dashboard ajuda a entender o portfólio?
- **Clareza**: os dados apresentados são compreensíveis?
- **Completude**: as informações extraídas são suficientes?
- **Confiabilidade**: os dados extraídos pelo LLM são confiáveis?

### 2.4 Escrita e entrega (semanas 11-12)

- Relatório final com resultados
- Artigo acadêmico (se aplicável)

## 3. Cronograma resumido

| Semana | Atividade |
|---|---|
| 1-2 | Consciência do problema, definição de atributos-alvo |
| 3-5 | Desenvolvimento do pipeline LLM |
| 6-8 | Desenvolvimento do dashboard |
| 9-10 | Avaliação quantitativa e qualitativa |
| 11-12 | Escrita do relatório final |

## 4. Projetos do estudo de caso

| Projeto | Domínio | Complexidade |
|---|---|---|
| Freire Batista ADV | Jurídico / Saúde Suplementar | Média |
| Valença Odontologia | Jurídico / Compliance | Baixa |
| Kaka JJ | Esporte / Branding | Média |
| Bem Viver Fitoterápicos | Saúde / Regulatório | Alta |
| Dinoah ADV | Jurídico / Marketing | Média |
