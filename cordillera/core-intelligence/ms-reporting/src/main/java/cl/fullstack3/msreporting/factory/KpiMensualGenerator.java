package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.KpisClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class KpiMensualGenerator implements IReporteGenerador {

    private final KpisClient kpisClient;
    private final ObjectMapper objectMapper;

    @Override
    public String getTipo() {
        return "KPI_MENSUAL";
    }

    @Override
    public String getTituloDefault() {
        return "Reporte mensual de KPIs";
    }

    @Override
    public List<SeccionDTO> generar(String parametrosJson) {
        List<SeccionDTO> secciones = new ArrayList<>();
        Long periodoId = extraerPeriodoId(parametrosJson);

        String indicadores = kpisClient.fetchAllKpis();
        secciones.add(SeccionDTO.builder()
                .seccion("indicadores")
                .datosJson(indicadores)
                .orden(1)
                .build());

        if (periodoId != null) {
            String resultados = kpisClient.fetchResultadosByPeriodo(periodoId);
            secciones.add(SeccionDTO.builder()
                    .seccion("resultados_periodo")
                    .datosJson(resultados)
                    .orden(2)
                    .build());
        }
        return secciones;
    }

    private Long extraerPeriodoId(String parametrosJson) {
        if (parametrosJson == null || parametrosJson.isBlank()) return null;
        try {
            JsonNode node = objectMapper.readTree(parametrosJson).get("periodoId");
            return node != null && node.isNumber() ? node.asLong() : null;
        } catch (Exception e) {
            log.warn("parametros invalidos para {}: {}", getTipo(), e.getMessage());
            return null;
        }
    }
}
