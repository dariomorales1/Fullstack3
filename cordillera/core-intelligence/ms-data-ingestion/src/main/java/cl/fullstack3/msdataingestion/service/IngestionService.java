package cl.fullstack3.msdataingestion.service;

import cl.fullstack3.msdataingestion.client.CustomerClient;
import cl.fullstack3.msdataingestion.client.FinanceClient;
import cl.fullstack3.msdataingestion.client.InventoryClient;
import cl.fullstack3.msdataingestion.client.SalesClient;
import cl.fullstack3.msdataingestion.dto.IngestionResultDTO;
import cl.fullstack3.msdataingestion.model.IngestedData;
import cl.fullstack3.msdataingestion.model.IngestionLog;
import cl.fullstack3.msdataingestion.repository.IngestedDataRepository;
import cl.fullstack3.msdataingestion.repository.IngestionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestionService {

    private final SalesClient salesClient;
    private final InventoryClient inventoryClient;
    private final FinanceClient financeClient;
    private final CustomerClient customerClient;
    private final IngestedDataRepository ingestedDataRepository;
    private final IngestionLogRepository ingestionLogRepository;

    @Transactional
    public IngestionResultDTO runIngestion() {
        log.info("Iniciando ingesta de datos desde los 4 Data Source Services");

        LocalDateTime executionDate = LocalDateTime.now();
        List<IngestionResultDTO.SourceResult> sourceResults = new ArrayList<>();
        int totalRecords = 0;
        int totalErrors = 0;

        Map<String, Mono<String>> sources = Map.of(
                "ms-sales", salesClient.fetchSales(),
                "ms-inventory", inventoryClient.fetchInventory(),
                "ms-finance", financeClient.fetchFinance(),
                "ms-customer", customerClient.fetchCustomers()
        );

        // Ejecutar llamadas en paralelo con Mono.zip()
        var results = Mono.zip(
                salesClient.fetchSales(),
                inventoryClient.fetchInventory(),
                financeClient.fetchFinance(),
                customerClient.fetchCustomers()
        ).block();

        String[] serviceNames = {"ms-sales", "ms-inventory", "ms-finance", "ms-customer"};

        for (int i = 0; i < serviceNames.length; i++) {
            String serviceName = serviceNames[i];
            String rawData = results != null ? (String) results.get(i) : "[]";
            boolean isError = "[]".equals(rawData);

            String status = isError ? "ERROR" : "SUCCESS";
            int recordCount = isError ? 0 : 1;

            // Persistir datos ingestados
            IngestedData ingestedData = IngestedData.builder()
                    .sourceService(serviceName)
                    .rawData(rawData)
                    .timestamp(executionDate)
                    .status(status)
                    .build();
            ingestedDataRepository.save(ingestedData);

            // Registrar log de ingesta
            IngestionLog ingestionLog = IngestionLog.builder()
                    .executionDate(executionDate)
                    .recordsProcessed(recordCount)
                    .errors(isError ? 1 : 0)
                    .sourceService(serviceName)
                    .status(status)
                    .build();
            ingestionLogRepository.save(ingestionLog);

            totalRecords += recordCount;
            if (isError) totalErrors++;

            sourceResults.add(IngestionResultDTO.SourceResult.builder()
                    .sourceService(serviceName)
                    .status(status)
                    .recordsProcessed(recordCount)
                    .error(isError ? "No data returned or service unavailable" : null)
                    .build());

            log.info("Ingesta de {} completada con estado: {}", serviceName, status);
        }

        log.info("Ingesta completa. Registros procesados: {}, Errores: {}", totalRecords, totalErrors);

        return IngestionResultDTO.builder()
                .executionDate(executionDate)
                .totalRecordsProcessed(totalRecords)
                .totalErrors(totalErrors)
                .sourceResults(sourceResults)
                .build();
    }

    public IngestionResultDTO getLastIngestionStatus() {
        IngestionLog lastLog = ingestionLogRepository.findFirstByOrderByExecutionDateDesc();

        if (lastLog == null) {
            return IngestionResultDTO.builder()
                    .executionDate(null)
                    .totalRecordsProcessed(0)
                    .totalErrors(0)
                    .sourceResults(List.of())
                    .build();
        }

        List<IngestionLog> logs = ingestionLogRepository.findAllByOrderByExecutionDateDesc();
        LocalDateTime lastExecution = lastLog.getExecutionDate();

        // Filtrar logs de la ultima ejecucion
        List<IngestionLog> lastExecutionLogs = logs.stream()
                .filter(l -> l.getExecutionDate().equals(lastExecution))
                .toList();

        int totalRecords = lastExecutionLogs.stream().mapToInt(l -> l.getRecordsProcessed() != null ? l.getRecordsProcessed() : 0).sum();
        int totalErrors = lastExecutionLogs.stream().mapToInt(l -> l.getErrors() != null ? l.getErrors() : 0).sum();

        List<IngestionResultDTO.SourceResult> sourceResults = lastExecutionLogs.stream()
                .map(l -> IngestionResultDTO.SourceResult.builder()
                        .sourceService(l.getSourceService())
                        .status(l.getStatus())
                        .recordsProcessed(l.getRecordsProcessed() != null ? l.getRecordsProcessed() : 0)
                        .build())
                .toList();

        return IngestionResultDTO.builder()
                .executionDate(lastExecution)
                .totalRecordsProcessed(totalRecords)
                .totalErrors(totalErrors)
                .sourceResults(sourceResults)
                .build();
    }

    public List<IngestedData> getDataBySource(String sourceService) {
        return ingestedDataRepository.findBySourceServiceOrderByTimestampDesc(sourceService);
    }

    public List<IngestionLog> getAllLogs() {
        return ingestionLogRepository.findAllByOrderByExecutionDateDesc();
    }
}
