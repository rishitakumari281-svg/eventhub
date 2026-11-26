package com.eventhub.controller;

import com.eventhub.dto.RoleRequest;
import com.eventhub.dto.UserDto;
import com.eventhub.entity.*;
import com.eventhub.exception.ApiException;
import com.eventhub.repository.*;
import com.eventhub.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository users;
    private final EventRepository events;
    private final RegistrationRepository registrations;

    public AdminController(UserRepository users, EventRepository events,
                           RegistrationRepository registrations) {
        this.users = users;
        this.events = events;
        this.registrations = registrations;
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return users.findAll().stream().map(UserDto::from).toList();
    }

    @PutMapping("/users/{id}/role")
    public UserDto setRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req,
                           @AuthenticationPrincipal AuthUser me) {
        if (id.equals(me.id()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own role.");
        User user = users.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        user.setRole(req.role());
        return UserDto.from(users.save(user));
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        long confirmed = registrations.countByStatus(RegistrationStatus.CONFIRMED);
        long attended = registrations.countByStatusAndCheckedInAtIsNotNull(RegistrationStatus.CONFIRMED);

        List<Map<String, Object>> reports = events.findAll().stream().map(event -> {
            long total = registrations.countByEventIdAndStatus(
                event.getId(), RegistrationStatus.CONFIRMED);
            long present = registrations.findByEventIdAndStatusOrderByCreatedAtDesc(
                event.getId(), RegistrationStatus.CONFIRMED)
                .stream().filter(r -> r.getCheckedInAt() != null).count();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("eventId", event.getId());
            row.put("eventTitle", event.getTitle());
            row.put("date", event.getDate().toString());
            row.put("registrations", total);
            row.put("attended", present);
            row.put("attendancePercentage", total == 0 ? 0 :
                Math.round(present * 10000.0 / total) / 100.0);
            return row;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", users.count());
        result.put("totalEvents", events.count());
        result.put("totalRegistrations", confirmed);
        result.put("totalAttendance", attended);
        result.put("attendancePercentage", confirmed == 0 ? 0 :
            Math.round(attended * 10000.0 / confirmed) / 100.0);
        result.put("events", reports);
        return result;
    }

    @GetMapping("/events/{eventId}/registrations")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> eventRegistrations(@PathVariable Long eventId) {
        if (!events.existsById(eventId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Event not found.");

        return registrations.findByEventIdAndStatusOrderByCreatedAtDesc(
            eventId, RegistrationStatus.CONFIRMED).stream().map(r -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", r.getId());
                row.put("name", r.getUser().getName());
                row.put("email", r.getUser().getEmail());
                row.put("ticketId", r.getTicketId());
                row.put("teamName", r.getTeamName());
                row.put("registeredAt", r.getCreatedAt());
                row.put("present", r.getCheckedInAt() != null);
                return row;
            }).toList();
    }

    @PutMapping("/registrations/{id}/attendance")
    @Transactional
    public Map<String, Object> markAttendance(@PathVariable Long id,
                                              @RequestParam boolean present) {
        Registration r = registrations.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registration not found."));

        if (r.getStatus() != RegistrationStatus.CONFIRMED)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only confirmed registrations can be marked.");

        r.setCheckedInAt(present ? Instant.now() : null);
        registrations.save(r);

        return Map.of("id", r.getId(), "present", present,
                      "message", present ? "Attendance marked." : "Attendance removed.");
    }
}

