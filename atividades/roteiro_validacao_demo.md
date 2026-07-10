# Roteiro de validação da demo — copie e cole cada dado

> Todos os textos abaixo foram testados: o resultado esperado da IA está indicado em cada passo.
> Antes de começar (estado limpo): `.claude/skills/run-app/scripts/stop.sh && rm -rf backend/data/ && .claude/skills/run-app/scripts/run.sh`
> App: http://localhost:5173 · Plano B sem internet: `OBIONE_LLM_PROVIDER=mock` no `.env` (reiniciar backend).

---

## PASSO 0 — Login do consultor

Abra http://localhost:5173/login

```
consultor@obione.dev
```
```
consultor123
```

---

## PASSO 1 — Cadastrar projeto com IA (Configuradora)

Menu **Projetos → Novo projeto**.

**Nome do projeto:**
```
Expansão Digital Vitalis Saúde
```

**Descrição do projeto:**
```
A Vitalis, rede de clínicas, quer dobrar a captação de pacientes pelos canais digitais em 6 meses. Vamos reformular o site, criar campanhas de mídia paga e implantar um CRM simples. Cliente novo, nunca trabalhou com agência; orçamento apertado e diretoria ansiosa por resultado rápido.
```

Clique **Continuar com IA**.

✅ **Esperado:** domínio **Comunicação Digital** (~94%), ~16 atributos marcados (objetivos, custos, riscos, cronograma...), rationale citando trechos da descrição.

### Na etapa 2 — criar o cliente novo (inline)

No campo Cliente, clique **+ Novo cliente**:

**Nome:**
```
Cliente Vitalis Saúde
```
**E-mail:**
```
vitalis@cliente.dev
```
**Senha provisória:**
```
vitalis123
```

Clique **Criar e selecionar**.

**Data de início:**
```
2026-07-01
```
(Conclusão é opcional — pode deixar vazio.)

Clique **Cadastrar projeto**. ✅ Redireciona para o detalhe do projeto novo.

💡 *Já no detalhe, mostre a aba **Aprendizados**: o bloco "Aprendizados do domínio" já traz um aprendizado de outro projeto (Campanha Orion) — reuso desde o dia zero.*

---

## PASSO 2 — Observação em 1 campo (IA estrutura)

No projeto Vitalis, aba **Observações → Registrar primeira observação** (nas próximas, o botão vira "Registrar observação").

**O que você observou?**
```
O cliente demorou mais de duas semanas para aprovar o novo posicionamento, e nesse meio tempo a equipe ficou parada esperando a decisão, o que atrasou o cronograma.
```

Clique **Estruturar com IA**.

✅ **Esperado:** Título ~"Atraso por aprovação do cliente" · Atributo **Status do cronograma** · interpretação sobre atraso/ociosidade. Revise e clique **Registrar observação**. O card entra na lista com o selo **"Sugerida pela IA"**.

---

## PASSO 3 — Iniciar a conversa

No card da observação recém-criada, clique **Iniciar conversa**.

✅ Título e pergunta já vêm preenchidos (só 2 campos — sem status/visibilidade). Clique **Iniciar conversa**.

💡 *Se abrir "Consolidar aprendizado" agora, aparece o aviso "esta conversa ainda não tem contribuições" — mostre e feche (governança da evidência).*

---

## PASSO 4 — A vez do cliente (janela anônima / outro navegador)

Abra http://localhost:5173/login em **janela anônima**:

```
vitalis@cliente.dev
```
```
vitalis123
```

✅ **Esperado no home:** "Meu projeto" + bloco **"Novidades no seu projeto"** com badge **"2 novas"** (a observação e a conversa que o consultor acabou de criar).

**Prova do isolamento** — cole na barra de endereço:
```
http://localhost:5173/projects/1
```
✅ **Esperado:** "Projeto não encontrado" (é o projeto de outro cliente).

Volte ao home, clique na **conversa** nas Novidades (cai na aba Observações do projeto), clique **Comentar** no card da conversa para abrir a caixa e cole:

```
Da nossa parte, a demora foi porque o material chegou sem o contexto da decisão. Se vier com um resumo do que precisa ser decidido, conseguimos responder em até 2 dias.
```

Envie. ✅ Comentário aparece como **Cliente Vitalis Saúde**.

---

## PASSO 5 — Consolidar com IA (o momento-ouro)

De volta à janela do **consultor**: menu **Comunidade → Comunicação Digital**, ache a conversa "Conversa sobre: Atraso na aprovação..." e clique **Consolidar aprendizado**.

Clique **Sugerir com IA**.

✅ **Esperado (o clímax):** o rascunho **cita o cliente** — a causa vira "falta de contexto na solicitação" (não "cliente lento"), a recomendação vira "enviar solicitações já com o contexto e a decisão esperada", com confiança alta. **Um comentário do cliente inverteu o aprendizado.**

Revise e clique **Consolidar aprendizado**.

---

## PASSO 6 — Reaproveitamento (fecha o ciclo)

Menu **Projetos → Campanha Lançamento Orion** (mesmo domínio), aba **Aprendizados**.

✅ **Esperado:** o bloco **"Aprendizados do domínio"** mostra o aprendizado recém-consolidado da Vitalis — o conhecimento atravessou projetos.

💡 *Opcional: clique **Sintetizar padrões do domínio** (a Conectora) e mostre o painel de padrões e lições.*

---

## PASSO 7 — Governança (admin, opcional)

Saia e entre como:
```
admin@obione.dev
```
```
admin123
```

Menu **Configurações**.

✅ **Esperado:** "Sugestões da IA × aceites" mostrando **3/3 aceitas** (PROJECT SETUP 1/1 · OBSERVATIONS 1/1 · KNOWLEDGE 1/1, 100%) — cada sugestão da IA da jornada foi auditada, revisada e aceita.

---

## Se algo falhar

| Sintoma | Ação |
|---|---|
| Botão de IA com erro / lento | Sem internet? `OBIONE_LLM_PROVIDER=mock` no `.env` + reiniciar backend |
| Voltou pro login | Sessão expirou (12h) — logar de novo |
| Dados sujos de ensaio | `stop.sh` → `rm -rf backend/data/` → `run.sh` |
| Texto da IA veio diferente do esperado | Normal (modelo real); o sentido se mantém — siga o roteiro |
