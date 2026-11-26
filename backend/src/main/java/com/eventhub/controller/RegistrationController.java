package com.eventhub.controller;

import com.eventhub.dto.*;
import java.util.Map;
import com.eventhub.exception.ApiException;
import com.eventhub.security.AuthUser;
import com.eventhub.service.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
    private final RegistrationService service;

    public RegistrationController(RegistrationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(
        @AuthenticationPrincipal AuthUser user,
        @RequestBody RegistrationRequest request) {
        return service.register(user, request);
    }

    @GetMapping("/mine")
    public List<RegistrationResponse> mine(@AuthenticationPrincipal AuthUser user) {
        return service.mine(user);
    }

    @GetMapping("/active/{eventId}")
    public RegistrationResponse active(
        @AuthenticationPrincipal AuthUser user,
        @PathVariable Long eventId) {
        return service.active(user, eventId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        service.cancel(user, id);
    }
@PostMapping("/scan/{eventId}")
public Map<String, Object> scanTicket(
    @AuthenticationPrincipal AuthUser user,
    @PathVariable Long eventId,
    @RequestBody Map<String, String> request) {

    String ticketId = request.get("ticketId");

    if (ticketId == null || ticketId.isBlank()) {
        throw new ApiException(
            HttpStatus.BAD_REQUEST, "Ticket ID is required.");
    }

    return service.scanTicket(user, eventId, ticketId);
}
}
