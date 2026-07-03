package cl.fullstack3.mskpis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndicadorResponseDTO {

    private Long id;
    private String codigo;
    private String nombre;
    private String tipo;
    private String unidad;
    private String formula;
    private BigDecimal valorReal;
    private BigDecimal valorMeta;
    private BigDecimal porcentajeCumplimiento;
    private String estado;
}
