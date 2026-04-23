package cl.fullstack3.mskpis.factory;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KpiFactoryTest {

    private KpiFactory factory;

    @BeforeEach
    void setUp() {
        factory = new KpiFactory(List.of(new KpiPorcentual(), new KpiAcumulado(), new KpiPromedio()));
    }

    @Test
    void getCalculator_devuelveKpiPorcentual() {
        IKpiCalculator calc = factory.getCalculator("PORCENTUAL");
        assertInstanceOf(KpiPorcentual.class, calc);
    }

    @Test
    void getCalculator_devuelveKpiAcumulado() {
        IKpiCalculator calc = factory.getCalculator("ACUMULADO");
        assertInstanceOf(KpiAcumulado.class, calc);
    }

    @Test
    void getCalculator_devuelveKpiPromedio() {
        IKpiCalculator calc = factory.getCalculator("PROMEDIO");
        assertInstanceOf(KpiPromedio.class, calc);
    }

    @Test
    void getCalculator_tipoInvalido_lanzaExcepcion() {
        assertThrows(IllegalArgumentException.class, () -> factory.getCalculator("INEXISTENTE"));
    }

    @Test
    void kpiPorcentual_calculaCumplimiento() {
        BigDecimal result = new KpiPorcentual().calculate(List.of(new BigDecimal("80"), new BigDecimal("100")));
        assertEquals(0, result.compareTo(new BigDecimal("80.0000")));
    }

    @Test
    void kpiAcumulado_sumaValores() {
        BigDecimal result = new KpiAcumulado().calculate(List.of(BigDecimal.valueOf(10), BigDecimal.valueOf(20), BigDecimal.valueOf(30)));
        assertEquals(0, result.compareTo(BigDecimal.valueOf(60)));
    }

    @Test
    void kpiPromedio_calculaMedia() {
        BigDecimal result = new KpiPromedio().calculate(List.of(BigDecimal.valueOf(10), BigDecimal.valueOf(20), BigDecimal.valueOf(30)));
        assertEquals(0, result.compareTo(new BigDecimal("20.0000")));
    }
}
