package com.example.nutritioncoach.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    @Test
    void shouldGenerateAndValidateToken() {
        JwtService jwtService = new JwtService("abcdefghijklmnopqrstuvwxyz0123456789", 60_000);
        String token = jwtService.generateToken("user@mail.com", "USER");
        assertNotNull(token);
        assertTrue(jwtService.isValid(token));
        assertEquals("user@mail.com", jwtService.getSubject(token));
        assertEquals("USER", jwtService.parseClaims(token).get("role", String.class));
    }

    @Test
    void shouldRejectMalformedToken() {
        JwtService jwtService = new JwtService("abcdefghijklmnopqrstuvwxyz0123456789", 60_000);
        assertFalse(jwtService.isValid("not-a-token"));
    }
}
