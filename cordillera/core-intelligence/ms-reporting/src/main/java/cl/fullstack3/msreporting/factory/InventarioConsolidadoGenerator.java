package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventarioConsolidadoGenerator implements IReporteGenerador {

    private final IngestionClient ingestionClient;
    private final ObjectMapper objectMapper;

    @Override
    public String getTipo() {
        return "INVENTARIO_CONSOLIDADO";
    }

    @Override
    public String getTituloDefault() {
        return "Reporte consolidado de inventario";
    }

    @Override
    public List<SeccionDTO> generar(String parametrosJson) {
        String raw = ingestionClient.fetchDataBySource("ms-inventory");
        String datos;
        try {
            datos = objectMapper.readTree(raw).toString();
        } catch (Exception e) {
            log.warn("Error generando {}: {}", getTipo(), e.getMessage());
            datos = "[]";
        }
        return List.of(SeccionDTO.builder()
                .seccion("inventario_raw")
                .datosJson(datos)
                .orden(1)
                .build());
    }
}
