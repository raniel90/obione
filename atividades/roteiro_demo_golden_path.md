# Pitch ObiOne — Fluxo de Demonstração

**Objetivo (10 min):** partir da dor "o conhecimento se perde entre projetos" e chegar, na tela, a dois resultados: **(1)** um aprendizado consolidado pela IA e revisado por você; **(2)** o cliente participando do projeto dele sem enxergar os outros.

**Como usar esta folha:** siga as linhas na ordem. Cada passo diz onde clicar, o que vai aparecer (para apontar) e uma frase para falar. Os blocos em vermelho são o resultado que fecha cada parte.

**Setup:** app no ar (`run-app`) ou URL pública (`share-app`). Logins: consultor `consultor@obione.dev` / `consultor123`; cliente `cliente@obione.dev` / `cliente123`.

## Parte A — A consultoria (login: consultor)

| Passo (faça isto) | O que aparece (aponte) | Diga |
|---|---|---|
| **1.** Abra a **tela de login** (`/login`); entre com `consultor@obione.dev` / `consultor123`; clique em **Entrar** | Cai na **Home / Observatório** já autenticado como consultor | "Entro como a consultoria." |
| **2.** Veja a **Home** | Panorama: os projetos, as comunidades por área e a atividade recente | "Tudo que está sendo observado, num lugar só." |
| **3.** **Projetos → Novo projeto**; descreva o projeto em 1 frase; **Continuar com IA** | A IA sugere o **domínio** e **o que acompanhar** | "Eu conto o projeto; a IA propõe. Eu reviso antes de cadastrar." |
| **4.** **Projetos → Reposicionamento Athos Capital**, aba **Observações** | Duas observações: "mudança de escopo" e "baixa participação do cliente" | "As evidências do projeto, com impacto e risco." |
| **5.** **Comunidade → Marketing Estratégico**; abra a conversa "mudança de escopo" | Participantes com papéis (governança, interpretação, cliente) e a conversa | "A observação vira conversa entre consultoria e cliente." |
| **6.** Na conversa: **Consolidar aprendizado → Sugerir com IA →** revise **→ Consolidar** | A IA preenche título, resumo e recomendação; você publica | "A IA escreve o aprendizado; eu reviso e assino." |

#### Resultado 1 — a conversa virou um aprendizado reutilizável, escrito pela IA e publicado por você.

| Passo (faça isto) | O que aparece (aponte) | Diga |
|---|---|---|
| **7.** Volte à **Comunidade**, seção **Aprendizados recentes** | Aprendizados de vários domínios (Branding, Comunicação Digital) | "Isso serve qualquer projeto parecido. Vira memória da consultoria." |

## Parte B — O cliente (login: cliente)

| Passo (faça isto) | O que aparece (aponte) | Diga |
|---|---|---|
| **8.** Clique em **Sair**; na **tela de login**, entre com `cliente@obione.dev` / `cliente123`; **Entrar** | Cai na **Home** como cliente | "Agora entro como o cliente." |
| **9.** Veja a **Home** | Título "Meu projeto": **um** projeto só, sem "Novo projeto" | "A mesma plataforma, pelos olhos do cliente." |
| **10.** Na barra de endereço, tente abrir `/projects/2` (de outro cliente) | "Projeto não encontrado" | "Ele nunca enxerga o caso de outro cliente." |
| **11.** Abra o projeto dele; vá à caixa de comentário na conversa | O cliente **pode comentar** | "No projeto dele, ele participa da conversa." |

#### Resultado 2 — o cliente participa do projeto dele e não vê os demais: comunidade aberta e confidencial ao mesmo tempo.

## Fechamento

"Você viu o ciclo: observar, discutir, consolidar e reutilizar — com a IA acelerando e o cliente dentro, com segurança. É a memória viva da consultoria." **CTA:** "Vamos fazer um piloto com um domínio e dois ou três projetos reais?"

## Se perguntarem

| Objeção | Resposta |
|---|---|
| "Meus dados de clientes ficam seguros?" | Cada cliente só vê o próprio projeto — acabei de mostrar. Acesso é por papel. |
| "A IA vai errar ou inventar?" | Ela nunca publica sozinha: propõe, o consultor revisa e decide. A origem fica registrada. |
| "Já uso Notion / planilha / PM." | Aquilo guarda tarefas; o ObiOne capitaliza conhecimento por domínio e põe o cliente na conversa. |

## Notas

- **IA sem internet:** rode com `OBIONE_LLM_PROVIDER=mock` — os mesmos botões funcionam.
- **O que é real hoje (não prometa além):** a observação é registro humano; os momentos de IA visíveis são o **cadastro** e a **consolidação**; o **isolamento por cliente** é real e demonstrável.
