package cl.fullstack3.bff.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class KpiDTO {

    private Long id;
    private String codigo;
    private String nombre;
    private String tipo;
    private String unidad;
    private BigDecimal valorReal;
    private BigDecimal valorMeta;
    private BigDecimal porcentajeCumplimiento;
    private String estado;
}
