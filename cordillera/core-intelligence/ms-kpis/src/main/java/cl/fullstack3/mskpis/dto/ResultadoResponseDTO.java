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
public class ResultadoResponseDTO {

    private Long id;
    private Long indicadorId;
    private String indicadorCodigo;
    private Long periodoId;
    private BigDecimal valorReal;
    private BigDecimal porcentajeCumplimiento;
    private String estado;
}
