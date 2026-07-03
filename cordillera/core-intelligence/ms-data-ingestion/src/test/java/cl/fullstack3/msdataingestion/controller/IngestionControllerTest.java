package cl.fullstack3.msdataingestion.controller;

import cl.fullstack3.msdataingestion.dto.IngestionResultDTO;
import cl.fullstack3.msdataingestion.model.IngestedData;
import cl.fullstack3.msdataingestion.model.IngestionLog;
import cl.fullstack3.msdataingestion.service.IngestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IngestionController.class)
@AutoConfigureMockMvc(addFilters = false)
class IngestionControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private IngestionService ingestionService;

    @Test
    void runIngestion_Returns200() throws Exception {
        when(ingestionService.runIngestion()).thenReturn(new IngestionResultDTO());
        mockMvc.perform(post("/api/ingestion/run")).andExpect(status().isOk());
    }

    @Test
    void getStatus_Returns200() throws Exception {
        when(ingestionService.getLastIngestionStatus()).thenReturn(new IngestionResultDTO());
        mockMvc.perform(get("/api/ingestion/status")).andExpect(status().isOk());
    }

    @Test
    void getDataBySource_Returns200() throws Exception {
        when(ingestionService.getDataBySource("ms-sales")).thenReturn(List.of(new IngestedData()));
        mockMvc.perform(get("/api/ingestion/data/ms-sales")).andExpect(status().isOk());
    }

    @Test
    void getLogs_Returns200() throws Exception {
        when(ingestionService.getAllLogs()).thenReturn(List.of(new IngestionLog()));
        mockMvc.perform(get("/api/ingestion/logs")).andExpect(status().isOk());
    }
}