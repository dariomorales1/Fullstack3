package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BalanceFinancieroGeneratorTest {

    @Test
    void generar_consolidaIngresosYEgresos() throws Exception {
        IngestionClient ingestionClient = mock(IngestionClient.class);
        ObjectMapper om = new ObjectMapper();

        String raw = """
                [
                  {
                    "sourceService":"ms-finance",
                    "rawData":"[{\\"tipo\\":\\"INGRESO\\",\\"monto\\":1000},{\\"tipo\\":\\"INGRESO\\",\\"monto\\":500},{\\"tipo\\":\\"EGRESO\\",\\"monto\\":300}]",
                    "status":"SUCCESS"
                  }
                ]
                """;
        when(ingestionClient.fetchDataBySource("ms-finance")).thenReturn(raw);

        BalanceFinancieroGenerator gen = new BalanceFinancieroGenerator(ingestionClient, om);
        List<SeccionDTO> secciones = gen.generar(null);

        assertEquals(1, secciones.size());
        SeccionDTO balance = secciones.get(0);
        assertEquals("balance", balance.getSeccion());

        var json = om.readTree(balance.getDatosJson());
        assertEquals(1500, json.get("ingresos").asInt());
        assertEquals(300, json.get("egresos").asInt());
        assertEquals(1200, json.get("utilidad").asInt());
    }
}
