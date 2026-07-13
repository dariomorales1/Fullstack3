package cl.fullstack3.msauth.service;

import cl.fullstack3.msauth.dto.*;
import cl.fullstack3.msauth.exception.AuthException;
import cl.fullstack3.msauth.model.PasswordResetToken;
import cl.fullstack3.msauth.model.User;
import cl.fullstack3.msauth.repository.IPasswordResetTokenRepository;
import cl.fullstack3.msauth.repository.IUserRepository;
import cl.fullstack3.msauth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private IUserRepository userRepository;
    @Mock private IPasswordResetTokenRepository resetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .email("test@cordillera.cl")
                .passwordHash("hashedPass")
                .role("USER")
                .activo(true)
                .build();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_ValidCorporateEmail_RegistersSuccessfully() {
        RegisterRequestDTO request = new RegisterRequestDTO("nuevo@cordillera.cl", "123456", "USER");
        when(userRepository.existsByEmail("nuevo@cordillera.cl")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("hashedPass");
        when(jwtUtil.generateToken("nuevo@cordillera.cl", "USER")).thenReturn("mockToken");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);

        AuthResponseDTO response = authService.register(request);

        assertEquals("mockToken", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_AuthorizedPersonalEmail_RegistersSuccessfully() {
        RegisterRequestDTO request = new RegisterRequestDTO("fe.ulloao@duocuc.cl", "123456", "ADMIN");
        when(userRepository.existsByEmail("fe.ulloao@duocuc.cl")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(jwtUtil.generateToken("fe.ulloao@duocuc.cl", "ADMIN")).thenReturn("mockToken");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);

        AuthResponseDTO response = authService.register(request);
        assertNotNull(response.getToken());
    }

    @Test
    void register_NullRole_DefaultsToUser() {
        RegisterRequestDTO request = new RegisterRequestDTO("otro@cordillera.cl", "123456", null);
        when(userRepository.existsByEmail("otro@cordillera.cl")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(jwtUtil.generateToken("otro@cordillera.cl", "USER")).thenReturn("token");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);

        authService.register(request);
        verify(jwtUtil).generateToken("otro@cordillera.cl", "USER");
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

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_ValidCredentials_ReturnsToken() {
        LoginRequestDTO request = new LoginRequestDTO("test@cordillera.cl", "123456");
        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("123456", "hashedPass")).thenReturn(true);
        when(jwtUtil.generateToken("test@cordillera.cl", "USER")).thenReturn("mockToken");

        AuthResponseDTO response = authService.login(request);
        assertEquals("mockToken", response.getToken());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequestDTO request = new LoginRequestDTO("test@cordillera.cl", "wrongpass");
        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongpass", "hashedPass")).thenReturn(false);

        assertThrows(AuthException.class, () -> authService.login(request));
    }

    @Test
    void login_InactiveUser_ThrowsException() {
        User inactiveUser = User.builder()
                .email("test@cordillera.cl")
                .passwordHash("hashedPass")
                .role("USER")
                .activo(false)
                .build();
        LoginRequestDTO request = new LoginRequestDTO("test@cordillera.cl", "123456");
        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(inactiveUser));

        assertThrows(AuthException.class, () -> authService.login(request));
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        LoginRequestDTO request = new LoginRequestDTO("noexiste@cordillera.cl", "123456");
        when(userRepository.findByEmail("noexiste@cordillera.cl")).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> authService.login(request));
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePassword_ValidRequest_UpdatesPassword() {
        ChangePasswordRequestDTO request = new ChangePasswordRequestDTO();
        request.setCurrentPassword("123456");
        request.setNewPassword("newPass");

        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("123456", "hashedPass")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("newHashedPass");

        authService.changePassword("test@cordillera.cl", request);

        verify(userRepository).save(activeUser);
        assertEquals("newHashedPass", activeUser.getPasswordHash());
    }

    @Test
    void changePassword_WrongCurrentPassword_ThrowsException() {
        ChangePasswordRequestDTO request = new ChangePasswordRequestDTO();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass");

        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", "hashedPass")).thenReturn(false);

        assertThrows(AuthException.class, () -> authService.changePassword("test@cordillera.cl", request));
    }

    @Test
    void changePassword_UserNotFound_ThrowsException() {
        ChangePasswordRequestDTO request = new ChangePasswordRequestDTO();
        request.setCurrentPassword("123456");
        request.setNewPassword("newPass");

        when(userRepository.findByEmail("noexiste@cordillera.cl")).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> authService.changePassword("noexiste@cordillera.cl", request));
    }

    // ── forgotPassword ────────────────────────────────────────────────────────

    @Test
    void forgotPassword_ExistingUser_SendsEmail() {
        ForgotPasswordRequestDTO request = new ForgotPasswordRequestDTO();
        request.setEmail("test@cordillera.cl");

        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));

        authService.forgotPassword(request);

        verify(resetTokenRepository).deleteByUserEmail("test@cordillera.cl");
        verify(resetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(anyString(), anyString(), any());
    }

    @Test
    void forgotPassword_NonExistentUser_DoesNotThrow() {
        ForgotPasswordRequestDTO request = new ForgotPasswordRequestDTO();
        request.setEmail("noexiste@cordillera.cl");

        when(userRepository.findByEmail("noexiste@cordillera.cl")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.forgotPassword(request));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_InvalidDomain_ThrowsException() {
        ForgotPasswordRequestDTO request = new ForgotPasswordRequestDTO();
        request.setEmail("test@gmail.com");

        assertThrows(AuthException.class, () -> authService.forgotPassword(request));
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    @Test
    void resetPassword_ValidToken_ResetsPassword() {
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token("validtoken")
                .userEmail("test@cordillera.cl")
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();

        ResetPasswordRequestDTO request = new ResetPasswordRequestDTO();
        request.setToken("validtoken");
        request.setNewPassword("newSecurePass");

        when(resetTokenRepository.findByTokenAndUsedFalse("validtoken")).thenReturn(Optional.of(resetToken));
        when(userRepository.findByEmail("test@cordillera.cl")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode("newSecurePass")).thenReturn("newHashedPass");

        authService.resetPassword(request);

        verify(userRepository).save(activeUser);
        assertTrue(resetToken.getUsed());
    }

    @Test
    void resetPassword_InvalidToken_ThrowsException() {
        ResetPasswordRequestDTO request = new ResetPasswordRequestDTO();
        request.setToken("invalidtoken");
        request.setNewPassword("newPass");

        when(resetTokenRepository.findByTokenAndUsedFalse("invalidtoken")).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPassword_ExpiredToken_ThrowsException() {
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .token("expiredtoken")
                .userEmail("test@cordillera.cl")
                .expiresAt(LocalDateTime.now().minusHours(1))
                .used(false)
                .build();

        ResetPasswordRequestDTO request = new ResetPasswordRequestDTO();
        request.setToken("expiredtoken");
        request.setNewPassword("newPass");

        when(resetTokenRepository.findByTokenAndUsedFalse("expiredtoken")).thenReturn(Optional.of(expiredToken));

        assertThrows(AuthException.class, () -> authService.resetPassword(request));
    }
}
