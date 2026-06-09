package br.com.obione.feed.controller;

import br.com.obione.feed.dto.FeedEventDTO;
import br.com.obione.feed.service.FeedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/feed")
@Tag(name = "Feed", description = "Linha do tempo real do observatório (Acompanhar)")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    @Operation(summary = "Eventos recentes (observações, discussões, conhecimento), opcionalmente por domínio/projeto")
    public List<FeedEventDTO> list(
            @RequestParam(required = false) Long domainId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return feedService.feed(domainId, projectId, limit);
    }
}
