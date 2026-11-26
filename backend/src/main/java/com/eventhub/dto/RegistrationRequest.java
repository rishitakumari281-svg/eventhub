package com.eventhub.dto;

import java.util.List;

public record RegistrationRequest(
        Long eventId,
        String teamName,
        List<TeamMemberRequest> members
) {
    public record TeamMemberRequest(
            String name,
            String email
    ) {}
}