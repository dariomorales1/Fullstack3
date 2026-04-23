package cl.fullstack3.msreporting.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "contenido_reporte")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContenidoReporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporte_id", nullable = false)
    @JsonIgnore
    private Reporte reporte;

    @Column(nullable = false, length = 100)
    private String seccion;

    @Column(name = "datos_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String datosJson;

    @Column
    private Integer orden;
}
