package cl.fullstack3.msreporting.service;

import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;
import cl.fullstack3.msreporting.exception.ResourceNotFoundException;
import cl.fullstack3.msreporting.factory.IReporteGenerador;
import cl.fullstack3.msreporting.factory.ReporteGeneratorFactory;
import cl.fullstack3.msreporting.factory.SeccionDTO;
import cl.fullstack3.msreporting.model.Reporte;
import cl.fullstack3.msreporting.repository.IReporteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteServiceImplTest {

    @Mock private IReporteRepository reporteRepository;
    @Mock private ReporteGeneratorFactory generatorFactory;
    @Mock private IReporteGenerador reporteGenerador;

    @InjectMocks
    private ReporteServiceImpl reporteService;

    private Reporte reporte;

    @BeforeEach
    void setUp() {
        reporte = new Reporte();
        reporte.setId(1L);
        reporte.setTipo("KPI_MENSUAL");
    }

    @Test
    void findAll_ReturnsList() {
        when(reporteRepository.findAllByOrderByFechaGeneracionDesc()).thenReturn(List.of(reporte));
        assertFalse(reporteService.findAll().isEmpty());
    }

    @Test
    void findById_Exists_ReturnsDto() {
        when(reporteRepository.findById(1L)).thenReturn(Optional.of(reporte));
        assertNotNull(reporteService.findById(1L));
    }

    @Test
    void findById_NotFound_ThrowsException() {
        when(reporteRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> reporteService.findById(1L));
    }

    @Test
    void generate_Success_ReturnsGenerated() {
        GenerarReporteRequestDTO req = new GenerarReporteRequestDTO();
        req.setTipo("KPI_MENSUAL");

        when(generatorFactory.getGenerador("KPI_MENSUAL")).thenReturn(reporteGenerador);
        when(reporteGenerador.getTipo()).thenReturn("KPI_MENSUAL");
        when(reporteGenerador.generar(any())).thenReturn(List.of(new SeccionDTO("sec", "{}", 1)));
        when(reporteRepository.save(any(Reporte.class))).thenReturn(reporte);

        ReporteResponseDTO res = reporteService.generate(req);
        assertEquals("KPI_MENSUAL", res.getTipo());
    }

    @Test
    void generate_WithException_SetsStatusError() {
        GenerarReporteRequestDTO req = new GenerarReporteRequestDTO();
        req.setTipo("KPI_MENSUAL");

        when(generatorFactory.getGenerador("KPI_MENSUAL")).thenReturn(reporteGenerador);
        when(reporteGenerador.generar(any())).thenThrow(new RuntimeException("Simulated Error"));
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(i -> i.getArgument(0));

        ReporteResponseDTO res = reporteService.generate(req);
        assertEquals("ERROR", res.getEstado());
    }

    @Test
    void delete_Exists_Deletes() {
        when(reporteRepository.existsById(1L)).thenReturn(true);
        doNothing().when(reporteRepository).deleteById(1L);
        reporteService.delete(1L);
        verify(reporteRepository).deleteById(1L);
    }

    @Test
    void delete_NotFound_ThrowsException() {
        when(reporteRepository.existsById(1L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> reporteService.delete(1L));
    }

    @Test
    void findByTipo_ReturnsList() {
        when(reporteRepository.findByTipoOrderByFechaGeneracionDesc("KPI_MENSUAL")).thenReturn(List.of(reporte));
        assertFalse(reporteService.findByTipo("KPI_MENSUAL").isEmpty());
    }
}