package com.eventhub.controller;

import com.eventhub.dto.EventDto;
import com.eventhub.dto.EventRequest;
import com.eventhub.security.AuthUser;
import com.eventhub.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;

    public EventController(EventService service) { this.service = service; }

    @GetMapping
    public List<EventDto> list() { return service.listPublic(); }

    @GetMapping("/mine")
    public List<EventDto> mine(@AuthenticationPrincipal AuthUser user) { return service.listMine(user); }

    @GetMapping("/{id}")
    public EventDto get(@PathVariable Long id) { return service.getPublic(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventDto create(@Valid @RequestBody EventRequest req, @AuthenticationPrincipal AuthUser user) {
        return service.create(req, user);
    }

    @PutMapping("/{id}")
    public EventDto update(@PathVariable Long id, @Valid @RequestBody EventRequest req,
                           @AuthenticationPrincipal AuthUser user) {
        return service.update(id, req, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        service.archive(id, user);
    }

    @DeleteMapping("/{id}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void permanentlyDelete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        service.permanentlyDelete(id, user);
    }
}

