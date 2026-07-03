package cl.fullstack3.msdataingestion.controller;

import cl.fullstack3.msdataingestion.dto.IngestionResultDTO;
import cl.fullstack3.msdataingestion.model.IngestedData;
import cl.fullstack3.msdataingestion.model.IngestionLog;
import cl.fullstack3.msdataingestion.service.IngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingestion")
@RequiredArgsConstructor
public class IngestionController {

    private final IngestionService ingestionService;

    @PostMapping("/run")
    public ResponseEntity<IngestionResultDTO> runIngestion() {
        IngestionResultDTO result = ingestionService.runIngestion();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<IngestionResultDTO> getStatus() {
        IngestionResultDTO status = ingestionService.getLastIngestionStatus();
        return ResponseEntity.ok(status);
    }

    @GetMapping("/data/{sourceService}")
    public ResponseEntity<List<IngestedData>> getDataBySource(@PathVariable String sourceService) {
        List<IngestedData> data = ingestionService.getDataBySource(sourceService);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<IngestionLog>> getLogs() {
        List<IngestionLog> logs = ingestionService.getAllLogs();
        return ResponseEntity.ok(logs);
    }
}
