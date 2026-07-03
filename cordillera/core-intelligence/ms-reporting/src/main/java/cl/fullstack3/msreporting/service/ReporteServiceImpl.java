package cl.fullstack3.msreporting.service;

import cl.fullstack3.msreporting.dto.ContenidoReporteDTO;
import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;
import cl.fullstack3.msreporting.exception.ResourceNotFoundException;
import cl.fullstack3.msreporting.factory.IReporteGenerador;
import cl.fullstack3.msreporting.factory.ReporteGeneratorFactory;
import cl.fullstack3.msreporting.factory.SeccionDTO;
import cl.fullstack3.msreporting.model.ContenidoReporte;
import cl.fullstack3.msreporting.model.Reporte;
import cl.fullstack3.msreporting.repository.IReporteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReporteServiceImpl implements IReporteService {

    private final IReporteRepository reporteRepository;
    private final ReporteGeneratorFactory generatorFactory;

    @Override
    public List<ReporteResponseDTO> findAll() {
        return reporteRepository.findAllByOrderByFechaGeneracionDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ReporteResponseDTO findById(Long id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reporte no encontrado con id: " + id));
        return toResponse(reporte);
    }

    @Override
    @Transactional
    public ReporteResponseDTO generate(GenerarReporteRequestDTO request) {
        IReporteGenerador generador = generatorFactory.getGenerador(request.getTipo());

        Reporte reporte = Reporte.builder()
                .tipo(generador.getTipo())
                .titulo(request.getTitulo() != null ? request.getTitulo() : generador.getTituloDefault())
                .parametros(request.getParametros())
                .estado("EN_PROCESO")
                .build();

        try {
            List<SeccionDTO> secciones = generador.generar(request.getParametros());
            for (SeccionDTO s : secciones) {
                ContenidoReporte contenido = ContenidoReporte.builder()
                        .reporte(reporte)
                        .seccion(s.getSeccion())
                        .datosJson(s.getDatosJson())
                        .orden(s.getOrden())
                        .build();
                reporte.getContenidos().add(contenido);
            }
            reporte.setEstado("GENERADO");
        } catch (Exception e) {
            log.error("Error generando reporte tipo={}: {}", request.getTipo(), e.getMessage());
            reporte.setEstado("ERROR");
        }

        Reporte saved = reporteRepository.save(reporte);
        log.info("Reporte {} ({}) generado con {} secciones, estado={}",
                saved.getId(), saved.getTipo(), saved.getContenidos().size(), saved.getEstado());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!reporteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reporte no encontrado con id: " + id);
        }
        reporteRepository.deleteById(id);
    }

    @Override
    public List<ReporteResponseDTO> findByTipo(String tipo) {
        return reporteRepository.findByTipoOrderByFechaGeneracionDesc(tipo).stream()
                .map(this::toResponse)
                .toList();
    }

    private ReporteResponseDTO toResponse(Reporte r) {
        List<ContenidoReporteDTO> contenidos = r.getContenidos().stream()
                .map(c -> ContenidoReporteDTO.builder()
                        .id(c.getId())
                        .seccion(c.getSeccion())
                        .datosJson(c.getDatosJson())
                        .orden(c.getOrden())
                        .build())
                .toList();
        return ReporteResponseDTO.builder()
                .id(r.getId())
                .tipo(r.getTipo())
                .titulo(r.getTitulo())
                .fechaGeneracion(r.getFechaGeneracion())
                .parametros(r.getParametros())
                .estado(r.getEstado())
                .contenidos(contenidos)
                .build();
    }
}
