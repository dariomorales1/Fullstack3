package cl.fullstack3.msauth.controller;

import cl.fullstack3.msauth.dto.AuthResponseDTO;
import cl.fullstack3.msauth.dto.ChangePasswordRequestDTO;
import cl.fullstack3.msauth.dto.LoginRequestDTO;
import cl.fullstack3.msauth.dto.RegisterRequestDTO;
import cl.fullstack3.msauth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody ChangePasswordRequestDTO request) {
        authService.changePassword(email, request);
        return ResponseEntity.ok(Map.of("message", "Contrasena actualizada correctamente"));
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, String>> validate(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(Map.of("email", email, "status", "valid"));
    }
}
