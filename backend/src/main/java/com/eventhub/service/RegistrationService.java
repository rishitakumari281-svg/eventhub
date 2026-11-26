package com.eventhub.service;

import com.eventhub.dto.*;
import java.util.Map;
import com.eventhub.entity.*;
import com.eventhub.exception.ApiException;
import com.eventhub.repository.*;
import com.eventhub.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class RegistrationService {
    private final RegistrationRepository registrations;
    private final EventRepository events;
    private final UserRepository users;

    public RegistrationService(RegistrationRepository r, EventRepository e, UserRepository u) {
        registrations = r;
        events = e;
        users = u;
    }

    @Transactional
    public RegistrationResponse register(AuthUser auth, RegistrationRequest request) {
        Event event = events.findById(request.eventId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Event not found."));

        User user = users.findById(auth.id())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        if (event.getStatus() != EventStatus.ACTIVE)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Event unavailable.");

        if (event.getRegistrationDeadline().isBefore(LocalDate.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration deadline passed.");

        if (registrations.findByUserIdAndEventIdAndStatus(
            user.getId(), event.getId(), RegistrationStatus.CONFIRMED).isPresent())
            throw new ApiException(HttpStatus.CONFLICT, "Already registered.");

        boolean teamEvent = event.getType() == EventType.TEAM;
        List<RegistrationRequest.TeamMemberRequest> members =
            request.members() == null ? List.of() : request.members();

        int total = teamEvent ? members.size() + 1 : 1;

        if (teamEvent) {
            if (request.teamName() == null || request.teamName().isBlank())
                throw new ApiException(HttpStatus.BAD_REQUEST, "Team name required.");

            if (total < event.getTeamMin() || total > event.getTeamMax())
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid team size.");

            for (var m : members) {
                if (m.name() == null || m.name().isBlank() ||
                    m.email() == null || m.email().isBlank())
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Complete member details.");
            }
        } else if (!members.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Individual event cannot have team members.");
        }

        long occupied =
            registrations.countByEventIdAndStatus(event.getId(), RegistrationStatus.CONFIRMED)
            + registrations.countMembers(event.getId(), RegistrationStatus.CONFIRMED);

        if (occupied + total > event.getSeats())
            throw new ApiException(HttpStatus.CONFLICT, "Not enough seats available.");

        Registration registration = new Registration(
            user, event, UUID.randomUUID().toString().replace("-", ""),
            teamEvent ? request.teamName().trim() : null
        );

        for (var m : members)
            registration.getMembers().add(
                new TeamMember(registration, m.name().trim(), m.email().trim()));

        registrations.save(registration);
        return toResponse(registration);
    }

    @Transactional(readOnly = true)
    public RegistrationResponse active(AuthUser auth, Long eventId) {
        return registrations.findByUserIdAndEventIdAndStatus(
            auth.id(), eventId, RegistrationStatus.CONFIRMED)
            .map(this::toResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> mine(AuthUser auth) {
        return registrations.findByUserIdOrderByCreatedAtDesc(auth.id())
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void cancel(AuthUser auth, Long id) {
        Registration r = registrations.findByIdAndUserId(id, auth.id())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registration not found."));

        if (r.getStatus() != RegistrationStatus.CONFIRMED)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Already cancelled.");

        r.setStatus(RegistrationStatus.CANCELLED);
        r.setCancelledAt(Instant.now());
    }
@Transactional
public Map<String, Object> scanTicket(AuthUser auth, Long eventId, String ticketId) {
    Registration r = registrations.findByTicketId(ticketId)
        .orElseThrow(() -> new ApiException(
            HttpStatus.NOT_FOUND, "Invalid QR code. Ticket not found."));

    if (!r.getEvent().getId().equals(eventId))
        throw new ApiException(HttpStatus.BAD_REQUEST,
            "This ticket belongs to another event.");

    if (r.getStatus() != RegistrationStatus.CONFIRMED)
        throw new ApiException(HttpStatus.BAD_REQUEST,
            "This registration is cancelled.");

    if (auth.role() != Role.ADMIN &&
        !r.getEvent().getOrganizer().getId().equals(auth.id()))
        throw new ApiException(HttpStatus.FORBIDDEN,
            "You cannot scan tickets for this event.");

    if (r.getCheckedInAt() != null)
        throw new ApiException(HttpStatus.CONFLICT,
            "Attendance already marked for this ticket.");

    r.setCheckedInAt(Instant.now());
    registrations.save(r);

    return Map.of(
        "success", true,
        "name", r.getUser().getName(),
        "event", r.getEvent().getTitle(),
        "message", "Attendance marked successfully."
    );
}

    private RegistrationResponse toResponse(Registration r) {
        Event e = r.getEvent();

        var event = new RegistrationResponse.EventSummary(
            e.getId(), e.getTitle(), e.getDate().toString(),
            e.getTime().toString(), e.getVenue());

        var members = r.getMembers().stream()
            .map(m -> new RegistrationRequest.TeamMemberRequest(m.getName(), m.getEmail()))
            .toList();

        var team = r.getTeamName() == null ? null :
            new RegistrationResponse.TeamSummary(
                r.getTeamName(), r.getUser().getName(), members);

        return new RegistrationResponse(
            r.getId(), r.getStatus().name().toLowerCase(),
            r.getTicketId(), e.getType().name().toLowerCase(),
            r.getCreatedAt(), event, team);
    }
}
