package cl.fullstack3.mskpis.factory;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class KpiPorcentual implements IKpiCalculator {

    @Override
    public BigDecimal calculate(List<BigDecimal> values) {
        if (values == null || values.size() < 2) return BigDecimal.ZERO;
        BigDecimal actual = values.get(0);
        BigDecimal objetivo = values.get(1);
        if (objetivo.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return actual.divide(objetivo, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    @Override
    public String getType() {
        return "PORCENTUAL";
    }
}
