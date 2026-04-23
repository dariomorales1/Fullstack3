package cl.fullstack3.mskpis.service;

import cl.fullstack3.mskpis.client.IngestionClient;
import cl.fullstack3.mskpis.dto.CalculoDesdeIngestionRequestDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;
import cl.fullstack3.mskpis.factory.KpiAcumulado;
import cl.fullstack3.mskpis.factory.KpiFactory;
import cl.fullstack3.mskpis.factory.KpiPorcentual;
import cl.fullstack3.mskpis.factory.KpiPromedio;
import cl.fullstack3.mskpis.model.Indicador;
import cl.fullstack3.mskpis.model.Objetivo;
import cl.fullstack3.mskpis.model.Periodo;
import cl.fullstack3.mskpis.model.Resultado;
import cl.fullstack3.mskpis.repository.IIndicadorRepository;
import cl.fullstack3.mskpis.repository.IObjetivoRepository;
import cl.fullstack3.mskpis.repository.IPeriodoRepository;
import cl.fullstack3.mskpis.repository.IResultadoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KpiServiceImplTest {

    private IIndicadorRepository indicadorRepository;
    private IPeriodoRepository periodoRepository;
    private IObjetivoRepository objetivoRepository;
    private IResultadoRepository resultadoRepository;
    private IngestionClient ingestionClient;
    private KpiServiceImpl service;

    @BeforeEach
    void setUp() {
        indicadorRepository = mock(IIndicadorRepository.class);
        periodoRepository = mock(IPeriodoRepository.class);
        objetivoRepository = mock(IObjetivoRepository.class);
        resultadoRepository = mock(IResultadoRepository.class);
        ingestionClient = mock(IngestionClient.class);

        KpiFactory factory = new KpiFactory(List.of(new KpiPorcentual(), new KpiAcumulado(), new KpiPromedio()));

        service = new KpiServiceImpl(
                indicadorRepository,
                periodoRepository,
                objetivoRepository,
                resultadoRepository,
                factory,
                ingestionClient,
                new ObjectMapper()
        );
    }

    @Test
    void calcularDesdeIngestion_tipoAcumulado_sumaMontosDeVentas() {
        Indicador indicador = Indicador.builder()
                .id(1L).codigo("KPI-002").tipo("ACUMULADO").unidad("CLP").build();
        Periodo periodo = Periodo.builder().id(3L).build();
        Objetivo objetivo = Objetivo.builder()
                .indicador(indicador).periodo(periodo)
                .valorMeta(new BigDecimal("1000")).umbralAlerta(new BigDecimal("80"))
                .build();

        when(indicadorRepository.findById(1L)).thenReturn(Optional.of(indicador));
        when(periodoRepository.findById(3L)).thenReturn(Optional.of(periodo));
        when(objetivoRepository.findByIndicadorIdAndPeriodoId(1L, 3L)).thenReturn(Optional.of(objetivo));
        when(resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(1L)).thenReturn(null);
        when(resultadoRepository.save(any(Resultado.class))).thenAnswer(inv -> {
            Resultado r = inv.getArgument(0);
            r.setId(99L);
            return r;
        });

        String ingestionResponse = """
                [
                  {
                    "sourceService": "ms-sales",
                    "rawData": "[{\\"monto\\":300},{\\"monto\\":450},{\\"monto\\":250}]",
                    "status": "SUCCESS"
                  }
                ]
                """;
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn(ingestionResponse);

        CalculoDesdeIngestionRequestDTO req = CalculoDesdeIngestionRequestDTO.builder()
                .indicadorId(1L).periodoId(3L)
                .sourceService("ms-sales").campoNumerico("monto")
                .build();

        ResultadoResponseDTO result = service.calcularDesdeIngestion(req);

        assertEquals(0, new BigDecimal("1000").compareTo(result.getValorReal()));
        assertEquals("CUMPLIDO", result.getEstado());
        assertEquals(0, new BigDecimal("100.0000").compareTo(result.getPorcentajeCumplimiento()));
        verify(ingestionClient).fetchDataBySource("ms-sales");
    }

    @Test
    void calcularDesdeIngestion_sinDatos_retornaCero() {
        Indicador indicador = Indicador.builder()
                .id(2L).codigo("KPI-003").tipo("PROMEDIO").unidad("CLP").build();
        Periodo periodo = Periodo.builder().id(1L).build();

        when(indicadorRepository.findById(2L)).thenReturn(Optional.of(indicador));
        when(periodoRepository.findById(1L)).thenReturn(Optional.of(periodo));
        when(objetivoRepository.findByIndicadorIdAndPeriodoId(2L, 1L)).thenReturn(Optional.empty());
        when(resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(2L)).thenReturn(null);
        when(resultadoRepository.save(any(Resultado.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn("[]");

        CalculoDesdeIngestionRequestDTO req = CalculoDesdeIngestionRequestDTO.builder()
                .indicadorId(2L).periodoId(1L)
                .sourceService("ms-sales").campoNumerico("monto")
                .build();

        ResultadoResponseDTO result = service.calcularDesdeIngestion(req);

        assertEquals(0, BigDecimal.ZERO.compareTo(result.getValorReal()));
        assertEquals("CRITICO", result.getEstado());
    }

    @Test
    void calcularDesdeIngestion_conResultadoPrevio_calculaVariacionYTendencia() {
        Indicador indicador = Indicador.builder()
                .id(5L).codigo("KPI-005").tipo("ACUMULADO").unidad("CLP").build();
        Periodo periodo = Periodo.builder().id(2L).build();
        Resultado anterior = Resultado.builder()
                .indicador(indicador).periodo(periodo)
                .valorReal(new BigDecimal("100")).build();

        when(indicadorRepository.findById(5L)).thenReturn(Optional.of(indicador));
        when(periodoRepository.findById(2L)).thenReturn(Optional.of(periodo));
        when(objetivoRepository.findByIndicadorIdAndPeriodoId(5L, 2L)).thenReturn(Optional.empty());
        when(resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(5L)).thenReturn(anterior);
        when(resultadoRepository.save(any(Resultado.class))).thenAnswer(inv -> inv.getArgument(0));

        String ingestionResponse = """
                [{"sourceService":"ms-finance","rawData":"[{\\"monto\\":200}]","status":"SUCCESS"}]
                """;
        when(ingestionClient.fetchDataBySource("ms-finance")).thenReturn(ingestionResponse);

        CalculoDesdeIngestionRequestDTO req = CalculoDesdeIngestionRequestDTO.builder()
                .indicadorId(5L).periodoId(2L)
                .sourceService("ms-finance").campoNumerico("monto")
                .build();

        ResultadoResponseDTO result = service.calcularDesdeIngestion(req);

        //Actual=200, Anterior=100 -> variacion = +100%, tendencia = ALZA
        assertEquals(0, new BigDecimal("200").compareTo(result.getValorReal()));
        assertEquals(0, new BigDecimal("100.0000").compareTo(result.getVariacion()));
        assertEquals("ALZA", result.getTendencia());
    }
}
