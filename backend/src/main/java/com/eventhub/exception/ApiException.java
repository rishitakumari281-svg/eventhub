package com.eventhub.exception;

import org.springframework.http.HttpStatus;

/** Throw this from services to produce a clean JSON error with the right HTTP status. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
