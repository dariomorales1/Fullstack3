package cl.fullstack3.msreporting.service;

import cl.fullstack3.msreporting.client.IngestionClient;
import cl.fullstack3.msreporting.client.KpisClient;
import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;
import cl.fullstack3.msreporting.factory.BalanceFinancieroGenerator;
import cl.fullstack3.msreporting.factory.InventarioConsolidadoGenerator;
import cl.fullstack3.msreporting.factory.KpiMensualGenerator;
import cl.fullstack3.msreporting.factory.ReporteGeneratorFactory;
import cl.fullstack3.msreporting.factory.VentasPorSucursalGenerator;
import cl.fullstack3.msreporting.model.Reporte;
import cl.fullstack3.msreporting.repository.IReporteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReporteServiceImplTest {

    private IReporteRepository reporteRepository;
    private IngestionClient ingestionClient;
    private KpisClient kpisClient;
    private ReporteServiceImpl service;

    @BeforeEach
    void setUp() {
        reporteRepository = mock(IReporteRepository.class);
        ingestionClient = mock(IngestionClient.class);
        kpisClient = mock(KpisClient.class);
        ObjectMapper om = new ObjectMapper();

        ReporteGeneratorFactory factory = new ReporteGeneratorFactory(List.of(
                new VentasPorSucursalGenerator(ingestionClient, om),
                new InventarioConsolidadoGenerator(ingestionClient, om),
                new KpiMensualGenerator(kpisClient, om),
                new BalanceFinancieroGenerator(ingestionClient, om)
        ));

        service = new ReporteServiceImpl(reporteRepository, factory);
    }

    @Test
    void generate_ventasPorSucursal_persisteReporteGenerado() {
        String raw = """
                [{"sourceService":"ms-sales","rawData":"[{\\"sucursalId\\":1,\\"monto\\":500},{\\"sucursalId\\":2,\\"monto\\":300}]","status":"SUCCESS"}]
                """;
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn(raw);
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(inv -> {
            Reporte r = inv.getArgument(0);
            r.setId(42L);
            return r;
        });

        GenerarReporteRequestDTO req = GenerarReporteRequestDTO.builder()
                .tipo("VENTAS_POR_SUCURSAL")
                .titulo("Ventas Q1")
                .parametros("{}")
                .build();

        ReporteResponseDTO response = service.generate(req);

        assertEquals("GENERADO", response.getEstado());
        assertEquals("VENTAS_POR_SUCURSAL", response.getTipo());
        assertEquals("Ventas Q1", response.getTitulo());
        assertEquals(42L, response.getId());
        assertFalse(response.getContenidos().isEmpty());
        verify(ingestionClient).fetchDataBySource("ms-sales");
    }

    @Test
    void generate_kpiMensual_consultaKpisClient() {
        when(kpisClient.fetchAllKpis()).thenReturn("[{\"codigo\":\"KPI-001\"}]");
        when(kpisClient.fetchResultadosByPeriodo(3L)).thenReturn("[]");
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerarReporteRequestDTO req = GenerarReporteRequestDTO.builder()
                .tipo("KPI_MENSUAL")
                .parametros("{\"periodoId\":3}")
                .build();

        ReporteResponseDTO response = service.generate(req);

        assertEquals("GENERADO", response.getEstado());
        assertEquals(2, response.getContenidos().size());
        verify(kpisClient).fetchAllKpis();
        verify(kpisClient).fetchResultadosByPeriodo(3L);
    }

    @Test
    void generate_tipoInvalido_lanzaExcepcion() {
        GenerarReporteRequestDTO req = GenerarReporteRequestDTO.builder().tipo("NO_EXISTE").build();
        assertThrows(IllegalArgumentException.class, () -> service.generate(req));
    }
}
