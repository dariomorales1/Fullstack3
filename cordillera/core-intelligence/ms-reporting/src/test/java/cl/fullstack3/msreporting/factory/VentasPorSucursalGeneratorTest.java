package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VentasPorSucursalGeneratorTest {

    private IngestionClient ingestionClient;
    private VentasPorSucursalGenerator generator;

    @BeforeEach
    void setUp() {
        ingestionClient = mock(IngestionClient.class);
        generator = new VentasPorSucursalGenerator(ingestionClient, new ObjectMapper());
    }

    @Test
    void getTipo_RetornaVentasPorSucursal() {
        assertEquals("VENTAS_POR_SUCURSAL", generator.getTipo());
    }

    @Test
    void getTituloDefault_RetornaTitulo() {
        assertNotNull(generator.getTituloDefault());
    }

    @Test
    void generar_conVentasConBranchId_AgregaTotalesPorSucursal() throws Exception {
        String raw = """
                [{"sourceService":"ms-sales",
                  "rawData":"[{\\"branchId\\":1,\\"amount\\":1000},{\\"branchId\\":1,\\"amount\\":500},{\\"branchId\\":2,\\"amount\\":300}]",
                  "status":"SUCCESS"}]
                """;
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn(raw);

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("totales_por_sucursal", secciones.get(0).getSeccion());

        var json = new ObjectMapper().readTree(secciones.get(0).getDatosJson());
        assertEquals(1500, json.get("1").asInt());
        assertEquals(300, json.get("2").asInt());
    }

    @Test
    void generar_conVentasConSucursalIdYMonto_AgregaTotales() throws Exception {
        String raw = """
                [{"sourceService":"ms-sales",
                  "rawData":"[{\\"sucursalId\\":5,\\"monto\\":2000}]",
                  "status":"SUCCESS"}]
                """;
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn(raw);

        List<SeccionDTO> secciones = generator.generar(null);

        var json = new ObjectMapper().readTree(secciones.get(0).getDatosJson());
        assertEquals(2000, json.get("5").asInt());
    }

    @Test
    void generar_conRespuestaVacia_RetornaSeccionSinTotales() throws Exception {
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn("[]");

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("{}", secciones.get(0).getDatosJson());
    }

    @Test
    void generar_conJsonInvalido_RetornaSeccionVacia() {
        when(ingestionClient.fetchDataBySource("ms-sales")).thenReturn("not-json");

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("totales_por_sucursal", secciones.get(0).getSeccion());
    }
}
