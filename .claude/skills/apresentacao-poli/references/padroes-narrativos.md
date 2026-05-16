# Padrões Narrativos

Estruturas que funcionam para apresentações acadêmicas curtas no padrão UPE/POLI. Cada uma vem com um caso de uso primário.

## Padrão A — Status report da cadeira (~15 min, com slides de aula)

Para apresentações regulares de status em disciplinas (ex.: TAES).

```
1. Capa
2. Agenda (4 itens · ~12-15 min)
3. Contexto: onde estamos no projeto
4. O que avançou desde a última apresentação
5. Decisões tomadas + justificativa
6. Riscos/bloqueios atuais
7. Próximos passos (curto prazo, até próxima apresentação)
8. Pedidos ao professor/turma (se houver)
9. Obrigado
```

Total: 8-9 slides. Sem divisores de "PARTE" (transição verbal basta).

## Padrão B — Reunião de orientação curta (~10-15 min)

Para reuniões pontuais com orientador.

```
CORE (apresenta linear em ~10 min):
1. Capa
2. Agenda compacta (3-4 partes)
3. Motivação (contexto + lacuna no card duplo)
4. Status atual (1 slide condensado)
5. O que decidi fazer + por quê
6. Pergunta(s) que preciso responder hoje
7. Obrigado

APÊNDICE (silencioso, puxa sob pergunta):
8. Divisor "Apêndice"
9-12. Slides de defesa para os pushbacks esperados
```

**Princípio**: as perguntas/asks devem aparecer **no terço final** (slide 6), não enterradas no fim. Apêndice existe para responder objeções com profundidade — sem isso, a reunião curta acaba antes de você defender o que importa.

## Padrão C — Apresentação de aula padrão (~30-45 min)

Para apresentar tema/seminário em sala.

```
1. Capa
2. Agenda (5-6 partes)
3-5. Contexto + problema + estado da arte
6-9. Desenvolvimento técnico (com exemplos)
10-11. Discussão / aplicação
12. Conclusão
13. Referências
14. Obrigado / discussão
```

## Princípios transversais

### 1. Asks-first em reuniões curtas

Em qualquer reunião <20 min, o orientador/professor pode te interromper antes do fim. Coloque as decisões a confirmar **antes do meio** da apresentação. Use o início para contexto mínimo necessário.

### 2. Card duplo para contexto + lacuna

Slide com duas colunas:
- **Esquerda (O CONTEXTO)**: o que existe / situação atual
- **Direita (A LACUNA)**: o que falta / problema, com 2-3 stats grandes

Padrão visual de cada stat: número grande UPE_RED + título 12pt + subtítulo 10pt + fonte 8pt italic.

### 3. Tabela compacta para comparações

Quando precisar comparar abordagens/trabalhos, use tabela com 4-6 colunas no máximo: identificador + 2-3 atributos + uma coluna "destaque" (verde para o que recomenda, vermelho para o que descarta).

### 4. Plano em fases com Plano B destacado

Para qualquer plano que dependa de fator externo (parceria, recurso, dado), incluir caixa **PLANO B** visualmente destacada (UPE_RED + bold) descrevendo o fallback. Isso responde antecipadamente ao pushback "e se X não acontecer?".

### 5. Apêndice para defesa de pushbacks esperados

Antes de finalizar, liste 3-4 pontos onde o ouvinte vai questionar. Para cada, monte um slide de apêndice com a defesa pronta. Quando ele atacar, você responde com o slide.

### 6. Footers consistentes

Todos os slides têm o mesmo footer formato. Após reorganizar, sempre rodar `update_footers(prs)`.

### 7. Footer de fontes em cards de stat

Stat de evidência (número grande) deve sempre ter um rodapé `Fonte: Autor et al. (Ano)` em italic 8pt. Sem isso, vira opinião.

## Anti-padrões narrativos

- **Não comece pela metodologia** em reuniões curtas — comece pelo problema e pela ask
- **Não enterre as decisões** no penúltimo slide
- **Não use divisores "PARTE 01/02/03"** em apresentações <20 min — desperdiçam tempo
- **Não inclua a história inteira do projeto** — só o relevante para a decisão de hoje
- **Não termine sem ask explícita** se houver decisão pendente
