package cl.fullstack3.mssales;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requiere PostgreSQL corriendo; se habilita en entornos de integracion")
class MsSalesApplicationTests {

    @Test
    void contextLoads() {
    }

}
