package cl.fullstack3.pedidos360.audit.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auditoria_eventos")
@Getter
@Setter
@NoArgsConstructor
public class AuditoriaEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 40)
    private String eventType;

    @Column(name = "pedido_id")
    private Long pedidoId;

    @Column(name = "cliente_id")
    private String clienteId;

    @Column(length = 20)
    private String estado;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "ocurrido_en")
    private Instant ocurridoEn;

    @Column(name = "registrado_en", nullable = false, updatable = false)
    private Instant registradoEn;

    @PrePersist
    void prePersist() {
        this.registradoEn = Instant.now();
    }
}
