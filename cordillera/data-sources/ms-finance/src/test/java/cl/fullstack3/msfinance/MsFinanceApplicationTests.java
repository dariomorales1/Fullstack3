package cl.fullstack3.msfinance;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requiere PostgreSQL corriendo; se habilita en entornos de integracion")
class MsFinanceApplicationTests {

    @Test
    void contextLoads() {
    }

}
