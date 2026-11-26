package com.eventhub.security;

import com.eventhub.entity.Role;

/** The logged-in user for the current request (available via @AuthenticationPrincipal). */
public record AuthUser(Long id, String email, String name, Role role) {}
