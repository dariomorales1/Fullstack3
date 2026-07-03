package cl.fullstack3.msreporting.service;

import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;

import java.util.List;

public interface IReporteService {

    List<ReporteResponseDTO> findAll();

    ReporteResponseDTO findById(Long id);

    ReporteResponseDTO generate(GenerarReporteRequestDTO request);

    void delete(Long id);

    List<ReporteResponseDTO> findByTipo(String tipo);
}
