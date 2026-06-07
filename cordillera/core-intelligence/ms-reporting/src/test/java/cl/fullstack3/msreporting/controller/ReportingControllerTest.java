package cl.fullstack3.msreporting.controller;

import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;
import cl.fullstack3.msreporting.service.IReporteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReporteController.class)
class ReportingControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private IReporteService reporteService;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void findAll_Returns200() throws Exception {
        when(reporteService.findAll()).thenReturn(List.of(new ReporteResponseDTO()));
        mockMvc.perform(get("/api/reports")).andExpect(status().isOk());
    }

    @Test
    void findById_Returns200() throws Exception {
        when(reporteService.findById(1L)).thenReturn(new ReporteResponseDTO());
        mockMvc.perform(get("/api/reports/1")).andExpect(status().isOk());
    }

    @Test
    void generate_Returns201() throws Exception {
        GenerarReporteRequestDTO req = new GenerarReporteRequestDTO();
        when(reporteService.generate(any())).thenReturn(new ReporteResponseDTO());

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    void delete_Returns204() throws Exception {
        doNothing().when(reporteService).delete(1L);
        mockMvc.perform(delete("/api/reports/1")).andExpect(status().isNoContent());
    }

    @Test
    void findByTipo_Returns200() throws Exception {
        when(reporteService.findByTipo("KPI_MENSUAL")).thenReturn(List.of(new ReporteResponseDTO()));
        mockMvc.perform(get("/api/reports/tipo/KPI_MENSUAL")).andExpect(status().isOk());
    }
}