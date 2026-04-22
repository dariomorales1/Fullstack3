package cl.fullstack3.mssales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SaleDTO {

    private Long id;
    private LocalDateTime date;
    private BigDecimal amount;
    private Long branchId;
    private Long customerId;
    private String paymentMethod;
    private String status;
    private List<SaleDetailDTO> details;

}
