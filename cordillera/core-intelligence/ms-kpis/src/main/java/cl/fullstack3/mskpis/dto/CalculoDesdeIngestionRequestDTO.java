package cl.fullstack3.mskpis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculoDesdeIngestionRequestDTO {

    private Long indicadorId;
    private Long periodoId;
    private String sourceService;
    private String campoNumerico;
}
