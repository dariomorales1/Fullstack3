package cl.fullstack3.mskpis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "objetivo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Objetivo {

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

    @Column(name = "valor_meta", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorMeta;

    @Column(name = "umbral_alerta", precision = 14, scale = 2)
    private BigDecimal umbralAlerta;
}
