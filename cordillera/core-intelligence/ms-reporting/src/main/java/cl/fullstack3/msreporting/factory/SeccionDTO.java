package cl.fullstack3.msreporting.factory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeccionDTO {

    private String seccion;
    private String datosJson;
    private Integer orden;
}
