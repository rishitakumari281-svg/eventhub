package com.eventhub.dto;

import jakarta.validation.constraints.*;

/** Note: there is deliberately NO role field. Public signup can only ever create a STUDENT. */
public record SignupRequest(
        @NotBlank @Size(min = 2, max = 80) String name,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 72)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain letters and numbers")
        String password) {}
