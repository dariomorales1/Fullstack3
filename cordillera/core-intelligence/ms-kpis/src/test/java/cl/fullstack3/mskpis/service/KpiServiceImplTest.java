package cl.fullstack3.mskpis.service;

import cl.fullstack3.mskpis.client.IngestionClient;
import cl.fullstack3.mskpis.dto.CalculoDesdeIngestionRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorRequestDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;
import cl.fullstack3.mskpis.exception.ResourceNotFoundException;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KpiServiceImplTest {

    @Mock private IIndicadorRepository indicadorRepository;
    @Mock private IPeriodoRepository periodoRepository;
    @Mock private IObjetivoRepository objetivoRepository;
    @Mock private IResultadoRepository resultadoRepository;
    @Mock private IngestionClient ingestionClient;

    private KpiServiceImpl service;
    private Indicador indicador;

    @BeforeEach
    void setUp() {
        KpiFactory factory = new KpiFactory(List.of(new KpiPorcentual(), new KpiAcumulado(), new KpiPromedio()));
        service = new KpiServiceImpl(
                indicadorRepository, periodoRepository, objetivoRepository,
                resultadoRepository, factory, ingestionClient, new ObjectMapper()
        );
        indicador = Indicador.builder().id(1L).codigo("KPI-002").tipo("ACUMULADO").build();
    }

    @Test
    void findAll_ReturnsList() {
        when(indicadorRepository.findAll()).thenReturn(List.of(indicador));
        assertFalse(service.findAll().isEmpty());
    }

    @Test
    void findById_NotFound_ThrowsException() {
        when(indicadorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.findById(1L));
    }

    @Test
    void create_ReturnsDto() {
        IndicadorRequestDTO req = new IndicadorRequestDTO();
        req.setCodigo("NEW");
        when(indicadorRepository.save(any(Indicador.class))).thenReturn(indicador);
        assertNotNull(service.create(req));
    }

    @Test
    void calcularDesdeIngestion_ConObjetivoYResultadoPrevio() {
        Periodo periodo = Periodo.builder().id(3L).build();
        Objetivo objetivo = Objetivo.builder()
                .indicador(indicador).periodo(periodo)
                .valorMeta(new BigDecimal("1000")).umbralAlerta(new BigDecimal("80"))
                .build();
        Resultado anterior = Resultado.builder()
                .indicador(indicador).periodo(periodo).valorReal(new BigDecimal("500")).build();

        when(indicadorRepository.findById(1L)).thenReturn(Optional.of(indicador));
        when(periodoRepository.findById(3L)).thenReturn(Optional.of(periodo));
        when(objetivoRepository.findByIndicadorIdAndPeriodoId(1L, 3L)).thenReturn(Optional.of(objetivo));
        when(resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(1L)).thenReturn(anterior);
        when(resultadoRepository.save(any(Resultado.class))).thenAnswer(i -> i.getArgument(0));

        String rawJson = "[{\"sourceService\": \"ms-sales\", \"rawData\": \"[{\\\"monto\\\":900}]\"}]";
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn(rawJson);

        CalculoDesdeIngestionRequestDTO req = CalculoDesdeIngestionRequestDTO.builder()
                .indicadorId(1L).periodoId(3L).sourceService("ms-sales").campoNumerico("monto").build();

        ResultadoResponseDTO result = service.calcularDesdeIngestion(req);

        assertEquals("EN_RIESGO", result.getEstado());
        assertEquals("ALZA", result.getTendencia());
    }

    @Test
    void getUltimoResultado_NotFound_ThrowsException() {
        when(resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(1L)).thenReturn(null);
        assertThrows(ResourceNotFoundException.class, () -> service.getUltimoResultado(1L));
    }

    @Test
    void findResultadosByPeriodo_ReturnsList() {
        Periodo periodo = Periodo.builder().id(1L).build();
        Resultado resultado = Resultado.builder().indicador(indicador).periodo(periodo).build();
        when(resultadoRepository.findByPeriodoId(1L)).thenReturn(List.of(resultado));
        assertFalse(service.findResultadosByPeriodo(1L).isEmpty());
    }
}