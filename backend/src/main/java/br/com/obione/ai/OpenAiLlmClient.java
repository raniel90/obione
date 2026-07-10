package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;
import br.com.obione.ai.dto.StructureObservationDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Real LLM adapter via Spring AI + OpenAI (enabled with obione.llm.provider=openai
 * and an OPENAI_API_KEY). Uses structured output ({@code .entity(...)}) to map the
 * model's JSON straight into the suggestion records.
 */
@Component
@ConditionalOnProperty(name = "obione.llm.provider", havingValue = "openai")
public class OpenAiLlmClient implements LlmClient {

    private final ChatClient chat;
    private final String model;

    public OpenAiLlmClient(
            ChatClient.Builder builder,
            @Value("${spring.ai.openai.chat.options.model:gpt-4o-mini}") String model
    ) {
        this.chat = builder.build();
        this.model = model;
    }

    @Override
    public String provider() {
        return "openai";
    }

    @Override
    public String model() {
        return model;
    }

    @Override
    public DomainSuggestionDTO suggestDomain(String projectSummary, String objective, List<String> availableDomainSlugs) {
        return chat.prompt()
                .system("Você classifica o domínio/temática de um projeto de consultoria. "
                        + "Escolha exatamente um dos slugs disponíveis e dê uma confiança entre 0 e 1.")
                .user("Resumo do projeto: " + projectSummary
                        + "\nObjetivo observacional: " + objective
                        + "\nSlugs disponíveis: " + String.join(", ", availableDomainSlugs))
                .call()
                .entity(DomainSuggestionDTO.class);
    }

    @Override
    public ObservationSuggestionsDTO suggestObservations(
            String projectSummary, String objective, String mpoLens,
            List<String> priorityAttributeIds, List<String> alreadyObserved) {
        String priorities = priorityAttributeIds == null || priorityAttributeIds.isEmpty()
                ? ""
                : "\nAtributos que o consultor declarou acompanhar neste projeto (priorize-os quando houver "
                        + "material no resumo): " + String.join(", ", priorityAttributeIds);
        String observed = alreadyObserved == null || alreadyObserved.isEmpty()
                ? ""
                : "\nObservações JÁ REGISTRADAS neste projeto (attributeId — título):\n"
                        + String.join("\n", alreadyObserved);
        return chat.prompt()
                .system("Você é um observador de projetos baseado no MPO (Quadro 37). "
                        + "Proponha observações relevantes, cada uma mapeada a UM attributeId da lente fornecida. "
                        + "impact deve ser LOW, MEDIUM ou HIGH. Não invente attributeId fora da lista. "
                        + "Não repita aspectos que já estão sendo observados: não use attributeId presente nas "
                        + "observações já registradas nem proponha conteúdo equivalente ao delas; se nada novo "
                        + "houver a observar, retorne a lista vazia. "
                        + "Em sourceExcerpt, cite o trecho LITERAL do resumo que motivou a observação.")
                .user("Resumo do projeto: " + projectSummary
                        + "\nObjetivo observacional: " + objective
                        + priorities
                        + observed
                        + "\nLente MPO (attributeId — rótulo (categoria)):\n" + mpoLens)
                .call()
                .entity(ObservationSuggestionsDTO.class);
    }

    @Override
    public KnowledgeDraftDTO suggestKnowledge(String discussionTitle, String question, List<String> contributions) {
        return chat.prompt()
                .system("Você consolida o conhecimento de uma discussão de comunidade em um rascunho objetivo. "
                        + "confidence deve ser LOW, MEDIUM ou HIGH.")
                .user("Discussão: " + discussionTitle
                        + "\nPergunta: " + question
                        + "\nContribuições:\n" + String.join("\n", contributions))
                .call()
                .entity(KnowledgeDraftDTO.class);
    }

    @Override
    public ProjectSetupSuggestionDTO suggestProjectSetup(
            String name, String description, String objective,
            List<String> availableDomainSlugs, String mpoLens) {
        return chat.prompt()
                .system("Você ajuda a configurar um novo projeto em um observatório de projetos baseado no MPO. "
                        + "A partir da descrição, sugira: o domínio (exatamente um dos slugs disponíveis, com confiança 0-1); "
                        + "os attributeIds da lente fornecida que valem acompanhar, sem limite fixo. Critério estrito: selecione "
                        + "um atributo APENAS se a descrição mencionar concretamente o assunto dele (fato, número, prazo, risco ou "
                        + "intenção explícita); não selecione por inferência genérica nem por 'seria bom acompanhar'. Uma descrição "
                        + "rica em detalhes leva a muitos atributos; uma descrição curta ou vaga leva a poucos. Não invente ids "
                        + "fora da lista. Sugira ainda de 2 a 6 fenômenos esperados (frases curtas em pt-BR, ex.: 'Risco de "
                        + "atraso') e um rationale breve que justifique a seleção citando os trechos da descrição.")
                .user("Nome do projeto: " + name
                        + "\nDescrição: " + description
                        + "\nObjetivo observacional: " + (objective == null ? "" : objective)
                        + "\nSlugs de domínio disponíveis: " + String.join(", ", availableDomainSlugs)
                        + "\nLente MPO (attributeId — rótulo (categoria)):\n" + mpoLens)
                .call()
                .entity(ProjectSetupSuggestionDTO.class);
    }

    @Override
    public DomainSynthesisDTO synthesize(String domainName, List<String> projectSummaries) {
        return chat.prompt()
                .system("Você sintetiza padrões e lições recorrentes entre projetos de um mesmo domínio "
                        + "(a 'Conectora'), de forma anonimizada e acionável.")
                .user("Domínio: " + domainName
                        + "\nResumos dos projetos:\n" + String.join("\n", projectSummaries))
                .call()
                .entity(DomainSynthesisDTO.class);
    }

    @Override
    public StructureObservationDTO structureObservation(String description, String mpoLens) {
        return chat.prompt()
                .system("A partir do texto de uma observação registrada num projeto, gere: "
                        + "title (um título curto e objetivo em pt-BR, máximo 10 palavras); "
                        + "attributeId (exatamente UM id da lente MPO fornecida que melhor se relaciona com a "
                        + "observação — não invente ids fora da lista; deixe vazio se nenhum se aplica); "
                        + "e interpretation (uma frase em pt-BR com a interpretação inicial do que isso significa "
                        + "para o projeto, focada no impacto observacional).")
                .user("Texto da observação: " + description
                        + "\n\nLente MPO (attributeId — rótulo (categoria)):\n" + mpoLens)
                .call()
                .entity(StructureObservationDTO.class);
    }
}
