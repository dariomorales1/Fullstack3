package cl.fullstack3.mskpis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculoKpiRequestDTO {

    private Long indicadorId;
    private Long periodoId;
    private List<BigDecimal> valores;
}
