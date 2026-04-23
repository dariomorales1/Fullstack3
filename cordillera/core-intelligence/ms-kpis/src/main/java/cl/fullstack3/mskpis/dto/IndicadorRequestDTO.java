package cl.fullstack3.mskpis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndicadorRequestDTO {

    private String codigo;
    private String nombre;
    private String tipo;
    private String unidad;
    private String formula;
}
