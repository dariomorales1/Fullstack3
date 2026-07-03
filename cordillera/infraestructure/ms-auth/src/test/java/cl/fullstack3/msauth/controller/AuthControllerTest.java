package cl.fullstack3.msauth.controller;

import cl.fullstack3.msauth.dto.*;
import cl.fullstack3.msauth.exception.AuthException;
import cl.fullstack3.msauth.security.JwtAuthFilter;
import cl.fullstack3.msauth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AuthService authService;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @Autowired private ObjectMapper objectMapper;

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_Returns201() throws Exception {
        RegisterRequestDTO req = new RegisterRequestDTO();
        req.setEmail("test@cordillera.cl");
        req.setPassword("123456");

        when(authService.register(any())).thenReturn(
                new AuthResponseDTO("token", "test@cordillera.cl", "USER", 3600L));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("token"));
    }

    @Test
    void register_AuthException_Returns401() throws Exception {
        RegisterRequestDTO req = new RegisterRequestDTO();
        req.setEmail("test@gmail.com");
        req.setPassword("123456");

        when(authService.register(any())).thenThrow(new AuthException("Dominio no permitido"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_Returns200() throws Exception {
        LoginRequestDTO req = new LoginRequestDTO();
        req.setEmail("test@cordillera.cl");
        req.setPassword("123456");

        when(authService.login(any())).thenReturn(
                new AuthResponseDTO("token", "test@cordillera.cl", "USER", 3600L));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@cordillera.cl"));
    }

    @Test
    void login_AuthException_Returns401() throws Exception {
        LoginRequestDTO req = new LoginRequestDTO();
        req.setEmail("test@cordillera.cl");
        req.setPassword("wrongpass");

        when(authService.login(any())).thenThrow(new AuthException("Credenciales invalidas"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ── change-password ───────────────────────────────────────────────────────

    @Test
    void changePassword_Returns200() throws Exception {
        ChangePasswordRequestDTO req = new ChangePasswordRequestDTO();
        req.setCurrentPassword("oldPass");
        req.setNewPassword("newPass1");

        doNothing().when(authService).changePassword(anyString(), any());

        mockMvc.perform(post("/api/auth/change-password")
                        .with(SecurityMockMvcRequestPostProcessors.user("test@cordillera.cl"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contrasena actualizada correctamente"));
    }

    // ── forgot-password ───────────────────────────────────────────────────────

    @Test
    void forgotPassword_Returns200() throws Exception {
        ForgotPasswordRequestDTO req = new ForgotPasswordRequestDTO();
        req.setEmail("test@cordillera.cl");

        doNothing().when(authService).forgotPassword(any());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    // ── reset-password ────────────────────────────────────────────────────────

    @Test
    void resetPassword_Returns200() throws Exception {
        ResetPasswordRequestDTO req = new ResetPasswordRequestDTO();
        req.setToken("sometoken");
        req.setNewPassword("newSecurePass");

        doNothing().when(authService).resetPassword(any());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contrasena restablecida correctamente"));
    }
}
