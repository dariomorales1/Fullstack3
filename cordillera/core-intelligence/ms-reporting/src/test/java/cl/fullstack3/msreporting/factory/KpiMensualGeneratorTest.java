package cl.fullstack3.msreporting.factory;

import cl.fullstack3.msreporting.client.KpisClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KpiMensualGeneratorTest {

    private KpisClient kpisClient;
    private KpiMensualGenerator generator;

    @BeforeEach
    void setUp() {
        kpisClient = mock(KpisClient.class);
        generator = new KpiMensualGenerator(kpisClient, new ObjectMapper());
    }

    @Test
    void getTipo_RetornaKpiMensual() {
        assertEquals("KPI_MENSUAL", generator.getTipo());
    }

    @Test
    void getTituloDefault_RetornaTitulo() {
        assertNotNull(generator.getTituloDefault());
    }

    @Test
    void generar_sinParametros_RetornaUnaSeccionDeIndicadores() {
        when(kpisClient.fetchAllKpis()).thenReturn("[{\"id\":1}]");

        List<SeccionDTO> secciones = generator.generar(null);

        assertEquals(1, secciones.size());
        assertEquals("indicadores", secciones.get(0).getSeccion());
    }

    @Test
    void generar_conPeriodoId_RetornaDosSeccionres() {
        when(kpisClient.fetchAllKpis()).thenReturn("[{\"id\":1}]");
        when(kpisClient.fetchResultadosByPeriodo(3L)).thenReturn("[{\"periodoId\":3}]");

        List<SeccionDTO> secciones = generator.generar("{\"periodoId\":3}");

        assertEquals(2, secciones.size());
        assertEquals("indicadores", secciones.get(0).getSeccion());
        assertEquals("resultados_periodo", secciones.get(1).getSeccion());
    }

    @Test
    void generar_conParametrosVacios_RetornaUnaSeccion() {
        when(kpisClient.fetchAllKpis()).thenReturn("[]");

        List<SeccionDTO> secciones = generator.generar("   ");

        assertEquals(1, secciones.size());
    }

    @Test
    void generar_conParametrosInvalidos_RetornaUnaSeccion() {
        when(kpisClient.fetchAllKpis()).thenReturn("[]");

        List<SeccionDTO> secciones = generator.generar("invalid-json{{");

        assertEquals(1, secciones.size());
    }

    @Test
    void generar_conPeriodoIdNullEnJson_RetornaUnaSeccion() {
        when(kpisClient.fetchAllKpis()).thenReturn("[]");

        List<SeccionDTO> secciones = generator.generar("{\"otrocampo\":1}");

        assertEquals(1, secciones.size());
    }
}
