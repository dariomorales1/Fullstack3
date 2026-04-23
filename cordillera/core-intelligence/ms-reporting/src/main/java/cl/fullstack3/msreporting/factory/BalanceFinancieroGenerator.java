package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BalanceFinancieroGenerator implements IReporteGenerador {

    private final IngestionClient ingestionClient;
    private final ObjectMapper objectMapper;

    @Override
    public String getTipo() {
        return "BALANCE_FINANCIERO";
    }

    @Override
    public String getTituloDefault() {
        return "Reporte de balance financiero";
    }

    @Override
    public List<SeccionDTO> generar(String parametrosJson) {
        List<SeccionDTO> secciones = new ArrayList<>();
        String raw = ingestionClient.fetchDataBySource("ms-finance");

        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        try {
            JsonNode root = objectMapper.readTree(raw);
            if (root.isArray()) {
                for (JsonNode ingested : root) {
                    JsonNode rawData = ingested.get("rawData");
                    if (rawData == null) continue;
                    JsonNode payload = rawData.isTextual() ? objectMapper.readTree(rawData.asText()) : rawData;
                    if (!payload.isArray()) continue;
                    for (JsonNode mov : payload) {
                        String tipo = mov.path("tipo").asText("");
                        BigDecimal monto = mov.path("monto").isNumber()
                                ? mov.path("monto").decimalValue() : BigDecimal.ZERO;
                        if ("INGRESO".equalsIgnoreCase(tipo)) totalIngresos = totalIngresos.add(monto);
                        else if ("EGRESO".equalsIgnoreCase(tipo)) totalEgresos = totalEgresos.add(monto);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error generando {}: {}", getTipo(), e.getMessage());
        }

        BigDecimal utilidad = totalIngresos.subtract(totalEgresos);
        ObjectNode balance = objectMapper.createObjectNode();
        balance.put("ingresos", totalIngresos);
        balance.put("egresos", totalEgresos);
        balance.put("utilidad", utilidad);

        secciones.add(SeccionDTO.builder()
                .seccion("balance")
                .datosJson(balance.toString())
                .orden(1)
                .build());
        return secciones;
    }
}
