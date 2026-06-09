package br.com.obione.feed.dto;

import java.time.Instant;

/**
 * One event in the observatory timeline. {@code kind} is one of
 * {@code observation}, {@code discussion}, {@code knowledge}.
 */
public record FeedEventDTO(
        String kind,
        Long id,
        String title,
        Long projectId,
        String projectName,
        Long domainId,
        String actorName,
        Instant createdAt
) {
}
