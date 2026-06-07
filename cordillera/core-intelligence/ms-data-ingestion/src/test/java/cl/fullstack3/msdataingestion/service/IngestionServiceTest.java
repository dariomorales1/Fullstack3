package cl.fullstack3.msdataingestion.service;

import cl.fullstack3.msdataingestion.client.*;
import cl.fullstack3.msdataingestion.dto.IngestionResultDTO;
import cl.fullstack3.msdataingestion.model.IngestedData;
import cl.fullstack3.msdataingestion.model.IngestionLog;
import cl.fullstack3.msdataingestion.repository.IIngestedDataRepository;
import cl.fullstack3.msdataingestion.repository.IIngestionLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IngestionServiceTest {

    @Mock private SalesClient salesClient;
    @Mock private InventoryClient inventoryClient;
    @Mock private FinanceClient financeClient;
    @Mock private CustomerClient customerClient;
    @Mock private IIngestedDataRepository ingestedDataRepository;
    @Mock private IIngestionLogRepository ingestionLogRepository;

    @InjectMocks
    private IngestionService ingestionService;

    @Test
    void runIngestion_WithSuccessAndErrors_ReturnsMixedStatus() {
        when(salesClient.fetchSales()).thenReturn(Mono.just("[{\"id\":1}]")); // Éxito
        when(inventoryClient.fetchInventory()).thenReturn(Mono.just("[]")); // Falla (vacío)
        when(financeClient.fetchFinance()).thenReturn(Mono.just("[{\"amount\":100}]"));
        when(customerClient.fetchCustomers()).thenReturn(Mono.just("[]")); // Falla (vacío)

        IngestionResultDTO result = ingestionService.runIngestion();

        assertEquals("ERROR", result.getStatus());
        assertEquals(2, result.getTotalRecordsProcessed());
        assertEquals(2, result.getTotalErrors());
        verify(ingestedDataRepository, times(4)).save(any(IngestedData.class));
    }

    @Test
    void getLastIngestionStatus_NullLog_ReturnsSinEjecucion() {
        when(ingestionLogRepository.findFirstByOrderByExecutionDateDesc()).thenReturn(null);
        IngestionResultDTO result = ingestionService.getLastIngestionStatus();
        assertEquals("SIN_EJECUCION", result.getStatus());
    }

    @Test
    void getLastIngestionStatus_HasLogs_ReturnsStatus() {
        LocalDateTime now = LocalDateTime.now();
        IngestionLog log1 = new IngestionLog(1L, now, 1, 0, "ms-sales", "SUCCESS");

        when(ingestionLogRepository.findFirstByOrderByExecutionDateDesc()).thenReturn(log1);
        when(ingestionLogRepository.findAllByOrderByExecutionDateDesc()).thenReturn(List.of(log1));

        IngestionResultDTO result = ingestionService.getLastIngestionStatus();
        assertEquals("SUCCESS", result.getStatus());
        assertEquals(1, result.getTotalRecordsProcessed());
    }

    @Test
    void getDataBySource_ReturnsList() {
        when(ingestedDataRepository.findBySourceServiceOrderByTimestampDesc("ms-sales"))
                .thenReturn(List.of(new IngestedData()));
        assertFalse(ingestionService.getDataBySource("ms-sales").isEmpty());
    }

    @Test
    void getAllLogs_ReturnsList() {
        when(ingestionLogRepository.findAllByOrderByExecutionDateDesc()).thenReturn(List.of(new IngestionLog()));
        assertFalse(ingestionService.getAllLogs().isEmpty());
    }
}