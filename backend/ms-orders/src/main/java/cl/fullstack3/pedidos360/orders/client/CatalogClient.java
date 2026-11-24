package cl.fullstack3.pedidos360.orders.client;

/** Puerto hacia el microservicio de catalogo. */
public interface CatalogClient {

    /** Descuenta stock de un producto. Puede fallar si el catalogo no responde. */
    void descontarStock(Long productoId, int cantidad);
}
