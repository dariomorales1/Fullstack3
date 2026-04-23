package cl.fullstack3.mskpis.service;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

        //Factory Method: obtiene el calculador segun el tipo de indicador
        IKpiCalculator calculator = kpiFactory.getCalculator(indicador.getTipo());
        BigDecimal valorReal = calculator.calculate(request.getValores());

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

        Resultado resultado = Resultado.builder()
                .indicador(indicador)
                .periodo(periodo)
                .valorReal(valorReal)
                .porcentajeCumplimiento(porcentajeCumplimiento)
                .estado(estado)
                .build();

        Resultado saved = resultadoRepository.save(resultado);
        log.info("KPI {} calculado ({}): valorReal={}, cumplimiento={}%, estado={}",
                indicador.getCodigo(), indicador.getTipo(), valorReal, porcentajeCumplimiento, estado);

        return toResultadoResponse(saved);
    }

    @Override
    public ResultadoResponseDTO getUltimoResultado(Long indicadorId) {
        Resultado resultado = resultadoRepository.findFirstByIndicadorIdOrderByIdDesc(indicadorId);
        if (resultado == null) {
            throw new ResourceNotFoundException("No hay resultados para el indicador id: " + indicadorId);
        }
        return toResultadoResponse(resultado);
    }

    @Override
    public List<ResultadoResponseDTO> findResultadosByPeriodo(Long periodoId) {
        return resultadoRepository.findByPeriodoId(periodoId).stream()
                .map(this::toResultadoResponse)
                .toList();
    }

    private String calcularEstado(BigDecimal cumplimiento, Objetivo objetivo) {
        BigDecimal umbral = objetivo.getUmbralAlerta();
        if (cumplimiento.compareTo(BigDecimal.valueOf(100)) >= 0) return "CUMPLIDO";
        if (umbral != null && cumplimiento.compareTo(umbral) >= 0) return "EN_RIESGO";
        return "CRITICO";
    }

    private IndicadorResponseDTO toIndicadorResponse(Indicador i) {
        return IndicadorResponseDTO.builder()
                .id(i.getId())
                .codigo(i.getCodigo())
                .nombre(i.getNombre())
                .tipo(i.getTipo())
                .unidad(i.getUnidad())
                .formula(i.getFormula())
                .build();
    }

    private ResultadoResponseDTO toResultadoResponse(Resultado r) {
        return ResultadoResponseDTO.builder()
                .id(r.getId())
                .indicadorId(r.getIndicador().getId())
                .indicadorCodigo(r.getIndicador().getCodigo())
                .periodoId(r.getPeriodo().getId())
                .valorReal(r.getValorReal())
                .porcentajeCumplimiento(r.getPorcentajeCumplimiento())
                .estado(r.getEstado())
                .build();
    }
}
