package cl.fullstack3.msauth.service;

import cl.fullstack3.msauth.dto.AuthResponseDTO;
import cl.fullstack3.msauth.dto.ChangePasswordRequestDTO;
import cl.fullstack3.msauth.dto.ForgotPasswordRequestDTO;
import cl.fullstack3.msauth.dto.LoginRequestDTO;
import cl.fullstack3.msauth.dto.RegisterRequestDTO;
import cl.fullstack3.msauth.dto.ResetPasswordRequestDTO;
import cl.fullstack3.msauth.exception.AuthException;
import cl.fullstack3.msauth.model.PasswordResetToken;
import cl.fullstack3.msauth.model.User;
import cl.fullstack3.msauth.repository.IPasswordResetTokenRepository;
import cl.fullstack3.msauth.repository.IUserRepository;
import cl.fullstack3.msauth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final IUserRepository userRepository;
    private final IPasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        validateEmailDomain(normalizedEmail);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException("El email ya esta registrado: " + normalizedEmail);
        }

        String role = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase()
                : "USER";

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);
        log.info("Usuario registrado: {}", user.getEmail());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return buildResponse(user, token);
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthException("Credenciales invalidas"));

        if (!user.getActivo()) {
            throw new AuthException("Usuario inactivo");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Credenciales invalidas");
        }

        log.info("Login exitoso: {}", user.getEmail());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return buildResponse(user, token);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequestDTO request) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AuthException("La contrasena actual es incorrecta");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Contrasena actualizada: {}", normalizedEmail);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        validateEmailDomain(normalizedEmail);

        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
            resetTokenRepository.deleteByUserEmail(normalizedEmail);

            String token = UUID.randomUUID().toString().replace("-", "");
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .userEmail(normalizedEmail)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();

            resetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(normalizedEmail, token, frontendUrl);
            log.info("Token de recuperacion generado para {}", normalizedEmail);
        }, () -> log.info("Solicitud de recuperacion ignorada para email inexistente: {}", normalizedEmail));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequestDTO request) {
        PasswordResetToken resetToken = resetTokenRepository.findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new AuthException("El enlace de recuperacion no es valido"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("El enlace de recuperacion ha expirado");
        }

        User user = userRepository.findByEmail(resetToken.getUserEmail())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        resetToken.setUsed(true);

        userRepository.save(user);
        resetTokenRepository.save(resetToken);
        log.info("Contrasena restablecida para {}", user.getEmail());
    }

    private void validateEmailDomain(String email) {
        String normalizedEmail = normalizeEmail(email);
        boolean allowed = normalizedEmail.endsWith("@cordillera.cl")
                || "fe.ulloao@duocuc.cl".equals(normalizedEmail);

        if (!allowed) {
            throw new AuthException("Solo se permiten emails corporativos (@cordillera.cl) o autorizados");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthResponseDTO buildResponse(User user, String token) {
        return AuthResponseDTO.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .expiresIn(jwtUtil.getExpirationMs())
                .build();
    }
}
