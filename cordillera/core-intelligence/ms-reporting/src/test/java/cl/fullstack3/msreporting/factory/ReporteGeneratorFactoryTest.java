package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import cl.fullstack3.msreporting.client.KpisClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class ReporteGeneratorFactoryTest {

    private ReporteGeneratorFactory factory;

    @BeforeEach
    void setUp() {
        IngestionClient ingestionClient = mock(IngestionClient.class);
        KpisClient kpisClient = mock(KpisClient.class);
        ObjectMapper om = new ObjectMapper();

        factory = new ReporteGeneratorFactory(List.of(
                new VentasPorSucursalGenerator(ingestionClient, om),
                new InventarioConsolidadoGenerator(ingestionClient, om),
                new KpiMensualGenerator(kpisClient, om),
                new BalanceFinancieroGenerator(ingestionClient, om)
        ));
    }

    @Test
    void getGenerador_ventasPorSucursal() {
        assertInstanceOf(VentasPorSucursalGenerator.class, factory.getGenerador("VENTAS_POR_SUCURSAL"));
    }

    @Test
    void getGenerador_inventarioConsolidado() {
        assertInstanceOf(InventarioConsolidadoGenerator.class, factory.getGenerador("INVENTARIO_CONSOLIDADO"));
    }

    @Test
    void getGenerador_kpiMensual() {
        assertInstanceOf(KpiMensualGenerator.class, factory.getGenerador("KPI_MENSUAL"));
    }

    @Test
    void getGenerador_balanceFinanciero() {
        assertInstanceOf(BalanceFinancieroGenerator.class, factory.getGenerador("BALANCE_FINANCIERO"));
    }

    @Test
    void getGenerador_tipoInvalido_lanzaExcepcion() {
        assertThrows(IllegalArgumentException.class, () -> factory.getGenerador("INEXISTENTE"));
    }

    @Test
    void getGenerador_tipoNull_lanzaExcepcion() {
        assertThrows(IllegalArgumentException.class, () -> factory.getGenerador(null));
    }
}
