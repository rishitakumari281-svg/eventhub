package com.eventhub.controller;

import com.eventhub.dto.RoleRequest;
import com.eventhub.dto.UserDto;
import com.eventhub.entity.User;
import com.eventhub.exception.ApiException;
import com.eventhub.repository.UserRepository;
import com.eventhub.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Everything under /api/admin requires the ADMIN role (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository users;

    public AdminController(UserRepository users) { this.users = users; }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return users.findAll().stream().map(UserDto::from).toList();
    }

    /** How a student becomes an organizer: an admin promotes them. */
    @PutMapping("/users/{id}/role")
    public UserDto setRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req,
                           @AuthenticationPrincipal AuthUser me) {
        if (id.equals(me.id())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own role.");
        }
        User user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        user.setRole(req.role());
        return UserDto.from(users.save(user));
    }
}
