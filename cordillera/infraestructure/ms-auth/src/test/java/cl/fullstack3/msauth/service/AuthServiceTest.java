package cl.fullstack3.msauth.service;

import cl.fullstack3.msauth.dto.AuthResponseDTO;
import cl.fullstack3.msauth.dto.LoginRequestDTO;
import cl.fullstack3.msauth.dto.RegisterRequestDTO;
import cl.fullstack3.msauth.exception.AuthException;
import cl.fullstack3.msauth.model.User;
import cl.fullstack3.msauth.repository.IUserRepository;
import cl.fullstack3.msauth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private IUserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@cordillera.cl")
                .passwordHash("hashedPass")
                .role("USER")
                .activo(true)
                .build();
    }

    @Test
    void register_ValidCorporateEmail_RegistersSuccessfully() {
        RegisterRequestDTO request = new RegisterRequestDTO("nuevo@cordillera.cl", "123456", "USER");

        when(userRepository.existsByEmail("nuevo@cordillera.cl")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("hashedPass");
        when(jwtUtil.generateToken("nuevo@cordillera.cl", "USER")).thenReturn("mockToken");
        when(userRepository.save(any(User.class))).thenReturn(user);

        AuthResponseDTO response = authService.register(request);

        assertEquals("mockToken", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_InvalidDomain_ThrowsException() {
        RegisterRequestDTO request = new RegisterRequestDTO("test@gmail.com", "123456", "USER");
        assertThrows(AuthException.class, () -> authService.register(request));
    }

    @Test
    void register_ExistingEmail_ThrowsException() {
        RegisterRequestDTO request = new RegisterRequestDTO("test@cordillera.cl", "123456", "USER");
        when(userRepository.existsByEmail("test@cordillera.cl")).thenReturn(true);
        assertThrows(AuthException.class, () -> authService.register(request));
    }

    @Test
    void login_ValidCredentials_ReturnsToken() {
        LoginRequestDTO request = new LoginRequestDTO("test@cordillera.cl", "123456");

        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "hashedPass")).thenReturn(true);
        when(jwtUtil.generateToken("test@cordillera.cl", "USER")).thenReturn("mockToken");

        AuthResponseDTO response = authService.login(request);
        assertEquals("mockToken", response.getToken());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequestDTO request = new LoginRequestDTO("test@cordillera.cl", "wrongpass");
        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashedPass")).thenReturn(false);

        assertThrows(AuthException.class, () -> authService.login(request));
    }
}