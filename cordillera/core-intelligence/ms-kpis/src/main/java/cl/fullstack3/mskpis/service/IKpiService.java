package cl.fullstack3.mskpis.service;

import cl.fullstack3.mskpis.dto.CalculoKpiRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorResponseDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;

import java.util.List;

public interface IKpiService {

    List<IndicadorResponseDTO> findAll();

    IndicadorResponseDTO findById(Long id);

    IndicadorResponseDTO create(IndicadorRequestDTO dto);

    ResultadoResponseDTO calcular(CalculoKpiRequestDTO request);

    ResultadoResponseDTO getUltimoResultado(Long indicadorId);

    List<ResultadoResponseDTO> findResultadosByPeriodo(Long periodoId);
}
