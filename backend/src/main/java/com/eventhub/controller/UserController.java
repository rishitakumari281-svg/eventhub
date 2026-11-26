package com.eventhub.controller;

import com.eventhub.dto.UserDto;
import com.eventhub.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthUser user) {
        return new UserDto(user.id(), user.name(), user.email(), user.role());
    }
}
