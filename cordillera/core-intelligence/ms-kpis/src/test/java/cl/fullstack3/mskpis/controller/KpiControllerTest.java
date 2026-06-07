package cl.fullstack3.mskpis.controller;

import cl.fullstack3.mskpis.dto.CalculoDesdeIngestionRequestDTO;
import cl.fullstack3.mskpis.dto.CalculoKpiRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorResponseDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;
import cl.fullstack3.mskpis.service.IKpiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KpiController.class)
@AutoConfigureMockMvc(addFilters = false)
class KpiControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private IKpiService kpiService;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void findAll_Returns200() throws Exception {
        when(kpiService.findAll()).thenReturn(List.of(new IndicadorResponseDTO()));
        mockMvc.perform(get("/api/kpis")).andExpect(status().isOk());
    }

    @Test
    void findById_Returns200() throws Exception {
        when(kpiService.findById(1L)).thenReturn(new IndicadorResponseDTO());
        mockMvc.perform(get("/api/kpis/1")).andExpect(status().isOk());
    }

    @Test
    void create_Returns201() throws Exception {
        IndicadorRequestDTO req = new IndicadorRequestDTO();
        when(kpiService.create(any())).thenReturn(new IndicadorResponseDTO());

        mockMvc.perform(post("/api/kpis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    void calcular_Returns200() throws Exception {
        CalculoKpiRequestDTO req = new CalculoKpiRequestDTO();
        when(kpiService.calcular(any())).thenReturn(new ResultadoResponseDTO());

        mockMvc.perform(post("/api/kpis/calcular")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void calcularDesdeIngestion_Returns200() throws Exception {
        CalculoDesdeIngestionRequestDTO req = new CalculoDesdeIngestionRequestDTO();
        when(kpiService.calcularDesdeIngestion(any())).thenReturn(new ResultadoResponseDTO());

        mockMvc.perform(post("/api/kpis/calcular-desde-ingestion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void getUltimoResultado_Returns200() throws Exception {
        when(kpiService.getUltimoResultado(1L)).thenReturn(new ResultadoResponseDTO());
        mockMvc.perform(get("/api/kpis/1/resultado")).andExpect(status().isOk());
    }

    @Test
    void findByPeriodo_Returns200() throws Exception {
        when(kpiService.findResultadosByPeriodo(1L)).thenReturn(List.of(new ResultadoResponseDTO()));
        mockMvc.perform(get("/api/kpis/periodo/1")).andExpect(status().isOk());
    }
}