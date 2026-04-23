package cl.fullstack3.bff;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requiere Eureka y MS del Core corriendo; se habilita en entornos de integracion")
class BffApplicationTests {

    @Test
    void contextLoads() {
    }

}
