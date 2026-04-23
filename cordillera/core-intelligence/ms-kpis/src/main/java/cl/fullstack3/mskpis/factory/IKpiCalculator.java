package cl.fullstack3.mskpis.factory;

import java.math.BigDecimal;
import java.util.List;

public interface IKpiCalculator {

    BigDecimal calculate(List<BigDecimal> values);

    String getType();
}
