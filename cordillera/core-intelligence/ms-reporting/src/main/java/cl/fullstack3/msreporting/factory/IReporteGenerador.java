package cl.fullstack3.msreporting.factory;

import java.util.List;

public interface IReporteGenerador {

    String getTipo();

    String getTituloDefault();

    List<SeccionDTO> generar(String parametrosJson);
}
