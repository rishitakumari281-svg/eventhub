package com.eventhub.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * What the API returns for an event. Field names mirror the frontend's sample data so the
 * switch from mock to real API is small. `registered` and `status` are computed by the server.
 */
public record EventDto(
        Long id, String title, String summary, String description,
        String category, String categoryName, String type,
        LocalDate date, LocalTime time, String venue, String organizer,
        int seats, int registered, int seatsLeft,
        LocalDate deadline, String eligibility, int teamMin, int teamMax,
        List<ScheduleItem> schedule, boolean featured, String pattern,
        String status,       // OPEN | FILLING | FULL | CLOSED
        String visibility,   // ACTIVE | ARCHIVED
        LocalDate addedOn) {}
