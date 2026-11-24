package cl.fullstack3.pedidos360.security;

/** Roles del sistema (coinciden con los app roles del tenant Azure AD). */
public final class Roles {

    public static final String ADMIN = "ADMIN";
    public static final String OPERADOR = "OPERADOR";
    public static final String CLIENTE = "CLIENTE";

    private Roles() {
    }
}
