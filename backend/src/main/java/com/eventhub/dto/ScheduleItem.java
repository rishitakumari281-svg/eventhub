package com.eventhub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScheduleItem(@NotBlank @Size(max = 30) String time, @NotBlank @Size(max = 120) String title) {}
