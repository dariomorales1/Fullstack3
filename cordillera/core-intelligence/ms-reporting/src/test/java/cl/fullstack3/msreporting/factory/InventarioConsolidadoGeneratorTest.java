package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.IngestionClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InventarioConsolidadoGeneratorTest {

    private IngestionClient ingestionClient;
    private InventarioConsolidadoGenerator generator;

    @BeforeEach
    void setUp() {
        ingestionClient = mock(IngestionClient.class);
        generator = new InventarioConsolidadoGenerator(ingestionClient, new ObjectMapper());
    }

    @Test
    void getTipo_RetornaInventarioConsolidado() {
        assertEquals("INVENTARIO_CONSOLIDADO", generator.getTipo());
    }

    @Test
    void getTituloDefault_RetornaTitulo() {
        assertNotNull(generator.getTituloDefault());
    }

    @Test
    void generar_conInventarioValido_RetornaSeccionConDatos() {
        String raw = "[{\"sku\":\"ABC\",\"cantidad\":10}]";
        when(ingestionClient.fetchDataBySource("ms-inventory")).thenReturn(raw);

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("inventario_raw", secciones.get(0).getSeccion());
        assertTrue(secciones.get(0).getDatosJson().contains("ABC"));
    }

    @Test
    void generar_conJsonInvalido_RetornaSeccionConArrayVacio() {
        when(ingestionClient.fetchDataBySource("ms-inventory")).thenReturn("not-json{{");

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("[]", secciones.get(0).getDatosJson());
    }

    @Test
    void generar_conRespuestaVacia_RetornaSeccion() {
        when(ingestionClient.fetchDataBySource("ms-inventory")).thenReturn("[]");

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("inventario_raw", secciones.get(0).getSeccion());
    }
}
