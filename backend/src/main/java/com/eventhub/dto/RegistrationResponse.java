package com.eventhub.dto;

import java.time.Instant;
import java.util.List;

public record RegistrationResponse(
        Long id,
        String status,
        String ticketId,
        String type,
        Instant createdAt,
        EventSummary event,
        TeamSummary team
) {
    public record EventSummary(
            Long id,
            String title,
            String date,
            String time,
            String venue
    ) {}

    public record TeamSummary(
            String name,
            String leader,
            List<RegistrationRequest.TeamMemberRequest> members
    ) {}
}