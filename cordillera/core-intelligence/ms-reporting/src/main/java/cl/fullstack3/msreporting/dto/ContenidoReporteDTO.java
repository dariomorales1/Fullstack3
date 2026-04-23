package cl.fullstack3.msreporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContenidoReporteDTO {

    private Long id;
    private String seccion;
    private String datosJson;
    private Integer orden;
}
