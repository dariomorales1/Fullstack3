package cl.fullstack3.msauth.controller;

import cl.fullstack3.msauth.dto.AuthResponseDTO;
import cl.fullstack3.msauth.dto.LoginRequestDTO;
import cl.fullstack3.msauth.dto.RegisterRequestDTO;
import cl.fullstack3.msauth.security.JwtAuthFilter;
import cl.fullstack3.msauth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private AuthService authService;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void register_Returns201() throws Exception {
        RegisterRequestDTO req = new RegisterRequestDTO();
        req.setEmail("test@cordillera.cl");
        req.setPassword("123456");

        when(authService.register(any())).thenReturn(new AuthResponseDTO("token", "test@cordillera.cl", "USER", 3600L));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    void login_Returns200() throws Exception {
        LoginRequestDTO req = new LoginRequestDTO();
        req.setEmail("test@cordillera.cl");
        req.setPassword("123456");

        when(authService.login(any())).thenReturn(new AuthResponseDTO("token", "test@cordillera.cl", "USER", 3600L));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}