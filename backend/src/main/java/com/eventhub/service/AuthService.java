package com.eventhub.service;

import com.eventhub.dto.*;
import com.eventhub.entity.Role;
import com.eventhub.entity.User;
import com.eventhub.exception.ApiException;
import com.eventhub.repository.UserRepository;
import com.eventhub.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        // Role is always STUDENT here. Organizer/admin roles are granted only by an admin.
        User user = users.save(new User(req.name().trim(), email, encoder.encode(req.password()), Role.STUDENT));
        return new AuthResponse(jwt.generate(user), UserDto.from(user));
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        // Same message for "no such user" and "wrong password" so attackers can't probe which emails exist.
        User user = users.findByEmail(email)
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password."));
        return new AuthResponse(jwt.generate(user), UserDto.from(user));
    }
}
