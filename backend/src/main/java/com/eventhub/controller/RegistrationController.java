package com.eventhub.controller;

import com.eventhub.dto.*;
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
}
