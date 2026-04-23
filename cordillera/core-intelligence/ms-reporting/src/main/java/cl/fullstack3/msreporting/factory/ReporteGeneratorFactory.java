package cl.fullstack3.msreporting.factory;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ReporteGeneratorFactory {

    private final List<IReporteGenerador> generadores;

    public IReporteGenerador getGenerador(String tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de reporte no puede ser nulo");
        }
        return generadores.stream()
                .filter(g -> g.getTipo().equalsIgnoreCase(tipo))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de reporte no soportado: " + tipo));
    }
}
