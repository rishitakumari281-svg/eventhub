package com.eventhub.dto;

import com.eventhub.entity.Role;
import com.eventhub.entity.User;

/** What the API reveals about a user. Never includes the password hash. */
public record UserDto(Long id, String name, String email, Role role) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole());
    }
}
