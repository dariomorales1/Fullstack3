package cl.fullstack3.msauth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "clave-secreta-de-prueba-muy-larga-para-hmac-sha");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);
    }

    @Test
    void generateToken_ReturnsNonNullToken() {
        String token = jwtUtil.generateToken("user@cordillera.cl", "USER");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractEmail_ReturnsCorrectEmail() {
        String token = jwtUtil.generateToken("user@cordillera.cl", "USER");
        assertEquals("user@cordillera.cl", jwtUtil.extractEmail(token));
    }

    @Test
    void extractRole_ReturnsCorrectRole() {
        String token = jwtUtil.generateToken("user@cordillera.cl", "ADMIN");
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }

    @Test
    void isTokenValid_ValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken("user@cordillera.cl", "USER");
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_InvalidToken_ReturnsFalse() {
        assertFalse(jwtUtil.isTokenValid("esto.no.es.un.token.valido"));
    }

    @Test
    void isTokenValid_TamperedToken_ReturnsFalse() {
        String token = jwtUtil.generateToken("user@cordillera.cl", "USER");
        assertFalse(jwtUtil.isTokenValid(token + "tampered"));
    }

    @Test
    void getExpirationMs_ReturnsConfiguredValue() {
        assertEquals(86400000L, jwtUtil.getExpirationMs());
    }
}
