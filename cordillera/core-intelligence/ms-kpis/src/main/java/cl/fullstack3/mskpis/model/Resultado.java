package cl.fullstack3.mskpis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "resultado")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resultado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicador_id", nullable = false)
    @JsonIgnore
    private Indicador indicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    private Periodo periodo;

    @Column(name = "valor_real", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorReal;

    @Column(name = "porcentaje_cumplimiento", precision = 6, scale = 2)
    private BigDecimal porcentajeCumplimiento;

    @Column(nullable = false, length = 30)
    private String estado;
}
