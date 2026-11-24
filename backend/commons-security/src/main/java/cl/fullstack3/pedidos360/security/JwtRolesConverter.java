package cl.fullstack3.pedidos360.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Convierte el claim "roles" del JWT (app roles de Azure AD) en autoridades
 * con el prefijo ROLE_ para usarlas con hasRole(...) / @PreAuthorize.
 */
public class JwtRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        Collection<GrantedAuthority> autoridades = new ArrayList<>();
        if (roles != null) {
            for (String rol : roles) {
                autoridades.add(new SimpleGrantedAuthority("ROLE_" + rol.trim().toUpperCase()));
            }
        }
        return autoridades;
    }
}
