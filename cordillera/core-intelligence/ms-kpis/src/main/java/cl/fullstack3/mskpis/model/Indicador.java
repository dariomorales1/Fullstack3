package cl.fullstack3.mskpis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "indicador")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Indicador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, length = 30)
    private String unidad;

    @Column(length = 500)
    private String formula;

    @OneToMany(mappedBy = "indicador", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Objetivo> objetivos = new ArrayList<>();

    @OneToMany(mappedBy = "indicador", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Resultado> resultados = new ArrayList<>();
}
