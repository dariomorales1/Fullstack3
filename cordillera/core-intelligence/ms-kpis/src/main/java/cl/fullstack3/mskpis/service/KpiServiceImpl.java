package cl.fullstack3.mskpis.service;

import cl.fullstack3.mskpis.client.IngestionClient;
import cl.fullstack3.mskpis.dto.CalculoDesdeIngestionRequestDTO;
import cl.fullstack3.mskpis.dto.CalculoKpiRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorResponseDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;
import cl.fullstack3.mskpis.exception.ResourceNotFoundException;
import cl.fullstack3.mskpis.factory.IKpiCalculator;
import cl.fullstack3.mskpis.factory.KpiFactory;
import cl.fullstack3.mskpis.model.Indicador;
import cl.fullstack3.mskpis.model.Objetivo;
import cl.fullstack3.mskpis.model.Periodo;
import cl.fullstack3.mskpis.model.Resultado;
import cl.fullstack3.mskpis.repository.IIndicadorRepository;
import cl.fullstack3.mskpis.repository.IObjetivoRepository;
import cl.fullstack3.mskpis.repository.IPeriodoRepository;
import cl.fullstack3.mskpis.repository.IResultadoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiServiceImpl implements IKpiService {

    private final IIndicadorRepository indicadorRepository;
    private final IPeriodoRepository periodoRepository;
    private final IObjetivoRepository objetivoRepository;
    private final IResultadoRepository resultadoRepository;
    private final KpiFactory kpiFactory;
    private final IngestionClient ingestionClient;
    private final ObjectMapper objectMapper;

    @Override
    public List<IndicadorResponseDTO> findAll() {
        return indicadorRepository.findAll().stream()
                .map(this::toIndicadorResponse)
                .toList();
    }

    @Override
    public IndicadorResponseDTO findById(Long id) {
        Indicador indicador = indicadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Indicador no encontrado con id: " + id));
        return toIndicadorResponse(indicador);
    }

    @Override
    @Transactional
    public IndicadorResponseDTO create(IndicadorRequestDTO dto) {
        Indicador indicador = Indicador.builder()
                .codigo(dto.getCodigo())
                .nombre(dto.getNombre())
                .tipo(dto.getTipo())
                .unidad(dto.getUnidad())
                .formula(dto.getFormula())
                .build();
        return toIndicadorResponse(indicadorRepository.save(indicador));
    }

    @Override
    @Transactional
    public ResultadoResponseDTO calcular(CalculoKpiRequestDTO request) {
        Indicador indicador = indicadorRepository.findById(request.getIndicadorId())
                .orElseThrow(() -> new ResourceNotFoundException("Indicador no encontrado con id: " + request.getIndicadorId()));

        Periodo periodo = periodoRepository.findById(request.getPeriodoId())
                .orElseThrow(() -> new ResourceNotFoundException("Periodo no encontrado con id: " + request.getPeriodoId()));

        return persistirCalculo(indicador, periodo, request.getValores());
    }

    @Override
    @Transactional
    public ResultadoResponseDTO calcularDesdeIngestion(CalculoDesdeIngestionRequestDTO request) {
        Indicador indicador = indicadorRepository.findById(request.getIndicadorId())
                .orElseThrow(() -> new ResourceNotFoundException("Indicador no encontrado con id: " + request.getIndicadorId()));

        Periodo periodo = periodoRepository.findById(request.getPeriodoId())
                .orElseThrow(() -> new ResourceNotFoundException("Periodo no encontrado con id: " + request.getPeriodoId()));

        String rawResponse = ingestionClient.fetchDataBySource(request.getSourceService());
        List<BigDecimal> valores = extraerValoresNumericos(rawResponse, request.getCampoNumerico());

        if (valores.isEmpty()) {
            log.warn("No se extrajeron valores de ms-data-ingestion para source={} campo={}",
                    request.getSourceService(), request.getCampoNumerico());
        }

        return persistirCalculo(indicador, periodo, valores);
    }

    private ResultadoResponseDTO persistirCalculo(Indicador indicador, Periodo periodo, List<BigDecimal> valores) {
        //Factory Method: obtiene el calculador segun el tipo de indicador
        IKpiCalculator calculator = kpiFactory.getCalculator(indicador.getTipo());
        BigDecimal valorReal = calculator.calculate(valores);

        Objetivo objetivo = objetivoRepository
                .findByIndicadorIdAndPeriodoId(indicador.getId(), periodo.getId())
                .orElse(null);

        BigDecimal porcentajeCumplimiento = BigDecimal.ZERO;
        String estado = "CRITICO";
        if (objetivo != null && objetivo.getValorMeta().compareTo(BigDecimal.ZERO) > 0) {
            porcentajeCumplimiento = valorReal
                    .divide(objetivo.getValorMeta(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            estado = calcularEstado(porcentajeCumplimiento, objetivo);
        }

        Resultado anterior = resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(indicador.getId());
        BigDecimal variacion = calcularVariacion(valorReal, anterior);
        String tendencia = calcularTendencia(variacion);

        Resultado resultado = Resultado.builder()
                .indicador(indicador)
                .periodo(periodo)
                .valorReal(valorReal)
                .porcentajeCumplimiento(porcentajeCumplimiento)
                .estado(estado)
                .build();

        Resultado saved = resultadoRepository.save(resultado);
        log.info("KPI {} ({}): valorReal={}, cumplimiento={}%, variacion={}%, tendencia={}, estado={}",
                indicador.getCodigo(), indicador.getTipo(),
                valorReal, porcentajeCumplimiento, variacion, tendencia, estado);

        return toResultadoResponse(saved, variacion, tendencia);
    }

    @Override
    public ResultadoResponseDTO getUltimoResultado(Long indicadorId) {
        Resultado resultado = resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(indicadorId);
        if (resultado == null) {
            throw new ResourceNotFoundException("No hay resultados para el indicador id: " + indicadorId);
        }
        return toResultadoResponse(resultado, null, null);
    }

    @Override
    public List<ResultadoResponseDTO> findResultadosByPeriodo(Long periodoId) {
        return resultadoRepository.findByPeriodoId(periodoId).stream()
                .map(r -> toResultadoResponse(r, null, null))
                .toList();
    }

    private List<BigDecimal> extraerValoresNumericos(String rawJsonResponse, String campoNumerico) {
        List<BigDecimal> valores = new ArrayList<>();
        if (rawJsonResponse == null || rawJsonResponse.isBlank() || campoNumerico == null) {
            return valores;
        }
        try {
            JsonNode root = objectMapper.readTree(rawJsonResponse);
            if (!root.isArray()) return valores;

            for (JsonNode ingestedData : root) {
                JsonNode rawData = ingestedData.get("rawData");
                if (rawData == null) continue;

                JsonNode payload = rawData.isTextual()
                        ? objectMapper.readTree(rawData.asText())
                        : rawData;

                if (payload.isArray()) {
                    for (JsonNode item : payload) {
                        recolectarCampo(item, campoNumerico, valores);
                    }
                } else {
                    recolectarCampo(payload, campoNumerico, valores);
                }
            }
        } catch (Exception e) {
            log.warn("Error parseando respuesta de ingestion: {}", e.getMessage());
        }
        return valores;
    }

    private void recolectarCampo(JsonNode node, String campo, List<BigDecimal> valores) {
        if (node == null) return;
        JsonNode target = node.get(campo);
        if (target != null && target.isNumber()) {
            valores.add(target.decimalValue());
        } else if (target != null && target.isTextual()) {
            try {
                valores.add(new BigDecimal(target.asText()));
            } catch (NumberFormatException ignore) {
                //Valor no numerico, se omite
            }
        }
    }

    private BigDecimal calcularVariacion(BigDecimal valorActual, Resultado anterior) {
        if (anterior == null || anterior.getValorReal() == null) return BigDecimal.ZERO;
        BigDecimal base = anterior.getValorReal();
        if (base.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return valorActual.subtract(base)
                .divide(base, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private String calcularTendencia(BigDecimal variacion) {
        if (variacion == null) return "ESTABLE";
        int cmp = variacion.compareTo(BigDecimal.ZERO);
        if (cmp > 0) return "ALZA";
        if (cmp < 0) return "BAJA";
        return "ESTABLE";
    }

    private String calcularEstado(BigDecimal cumplimiento, Objetivo objetivo) {
        BigDecimal umbral = objetivo.getUmbralAlerta();
        if (cumplimiento.compareTo(BigDecimal.valueOf(100)) >= 0) return "CUMPLIDO";
        if (umbral != null && cumplimiento.compareTo(umbral) >= 0) return "EN_RIESGO";
        return "CRITICO";
    }

    private IndicadorResponseDTO toIndicadorResponse(Indicador i) {
        Resultado ultimoResultado = resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(i.getId());
        BigDecimal valorMeta = null;

        if (ultimoResultado != null) {
            valorMeta = objetivoRepository
                    .findByIndicadorIdAndPeriodoId(i.getId(), ultimoResultado.getPeriodo().getId())
                    .map(Objetivo::getValorMeta)
                    .orElse(null);
        }

        return IndicadorResponseDTO.builder()
                .id(i.getId())
                .codigo(i.getCodigo())
                .nombre(i.getNombre())
                .tipo(i.getTipo())
                .unidad(i.getUnidad())
                .formula(i.getFormula())
                .valorReal(ultimoResultado != null ? ultimoResultado.getValorReal() : null)
                .valorMeta(valorMeta)
                .porcentajeCumplimiento(ultimoResultado != null ? ultimoResultado.getPorcentajeCumplimiento() : null)
                .estado(ultimoResultado != null ? ultimoResultado.getEstado() : null)
                .build();
    }

    private ResultadoResponseDTO toResultadoResponse(Resultado r, BigDecimal variacion, String tendencia) {
        return ResultadoResponseDTO.builder()
                .id(r.getId())
                .indicadorId(r.getIndicador().getId())
                .indicadorCodigo(r.getIndicador().getCodigo())
                .periodoId(r.getPeriodo().getId())
                .valorReal(r.getValorReal())
                .porcentajeCumplimiento(r.getPorcentajeCumplimiento())
                .variacion(variacion)
                .tendencia(tendencia)
                .estado(r.getEstado())
                .build();
    }
}
