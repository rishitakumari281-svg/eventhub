package com.eventhub.dto;

import com.eventhub.entity.EventType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Body for creating or updating an event. Cross-field rules are checked in EventService. */
public record EventRequest(
        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 300) String summary,
        @Size(max = 4000) String description,
        @NotBlank String category,           // category slug, e.g. "tech"
        @NotNull EventType type,
        @NotNull LocalDate date,             // 2026-12-12
        @NotNull LocalTime time,             // 09:00
        @NotBlank @Size(max = 150) String venue,
        @NotBlank @Size(max = 120) String organizerName,
        @Min(1) @Max(100000) int seats,
        @NotNull LocalDate registrationDeadline,
        @Size(max = 300) String eligibility,
        Integer teamMin,
        Integer teamMax,
        boolean featured,
        @Size(max = 20) List<@Valid ScheduleItem> schedule) {}
