package cl.fullstack3.mskpis.factory;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class KpiAcumulado implements IKpiCalculator {

    @Override
    public BigDecimal calculate(List<BigDecimal> values) {
        if (values == null || values.isEmpty()) return BigDecimal.ZERO;
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public String getType() {
        return "ACUMULADO";
    }
}
