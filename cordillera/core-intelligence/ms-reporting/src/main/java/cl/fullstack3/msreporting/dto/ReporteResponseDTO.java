package cl.fullstack3.msreporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteResponseDTO {

    private Long id;
    private String tipo;
    private String titulo;
    private LocalDateTime fechaGeneracion;
    private String parametros;
    private String estado;
    private List<ContenidoReporteDTO> contenidos;
}
