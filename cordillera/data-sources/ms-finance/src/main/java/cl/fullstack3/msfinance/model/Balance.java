package cl.fullstack3.msfinance.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "balance")
@Getter
@Setter
@NoArgsConstructor
public class Balance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    private String period;
    private BigDecimal income;
    private BigDecimal expenses;
    private BigDecimal profit;

}
