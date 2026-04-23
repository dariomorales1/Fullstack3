package cl.fullstack3.msreporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerarReporteRequestDTO {

    private String tipo;
    private String titulo;
    private String parametros;
}
