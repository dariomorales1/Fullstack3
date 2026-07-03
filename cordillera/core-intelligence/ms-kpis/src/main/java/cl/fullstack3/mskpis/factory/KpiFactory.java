package cl.fullstack3.mskpis.factory;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class KpiFactory {

    private final List<IKpiCalculator> calculators;

    public IKpiCalculator getCalculator(String tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de KPI no puede ser nulo");
        }
        return calculators.stream()
                .filter(c -> c.getType().equalsIgnoreCase(tipo))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo KPI no soportado: " + tipo));
    }
}
