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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class VentasPorSucursalGenerator implements IReporteGenerador {

    private final IngestionClient ingestionClient;
    private final ObjectMapper objectMapper;

    @Override
    public String getTipo() {
        return "VENTAS_POR_SUCURSAL";
    }

    @Override
    public String getTituloDefault() {
        return "Reporte de ventas por sucursal";
    }

    @Override
    public List<SeccionDTO> generar(String parametrosJson) {
        List<SeccionDTO> secciones = new ArrayList<>();
        String raw = ingestionClient.fetchDataBySource("ms-sales");
        Map<Long, BigDecimal> totales = new HashMap<>();

        try {
            JsonNode root = objectMapper.readTree(raw);
            if (root.isArray()) {
                for (JsonNode ingested : root) {
                    JsonNode rawData = ingested.get("rawData");
                    if (rawData == null) continue;
                    JsonNode payload = rawData.isTextual() ? objectMapper.readTree(rawData.asText()) : rawData;
                    if (!payload.isArray()) continue;
                    for (JsonNode venta : payload) {
                        Long sucursalId = venta.path("sucursalId").asLong(venta.path("branchId").asLong(0L));
                        BigDecimal monto = venta.path("monto").isNumber()
                                ? venta.path("monto").decimalValue()
                                : venta.path("amount").isNumber() ? venta.path("amount").decimalValue() : BigDecimal.ZERO;
                        totales.merge(sucursalId, monto, BigDecimal::add);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error generando {}: {}", getTipo(), e.getMessage());
        }

        ObjectNode resumen = objectMapper.createObjectNode();
        totales.forEach((sucursal, total) -> resumen.put(String.valueOf(sucursal), total));
        secciones.add(SeccionDTO.builder()
                .seccion("totales_por_sucursal")
                .datosJson(resumen.toString())
                .orden(1)
                .build());
        return secciones;
    }
}
