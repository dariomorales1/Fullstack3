package cl.fullstack3.msreporting;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requiere PostgreSQL y Eureka corriendo; se habilita en entornos de integracion")
class MsReportingApplicationTests {

    @Test
    void contextLoads() {
    }

}
