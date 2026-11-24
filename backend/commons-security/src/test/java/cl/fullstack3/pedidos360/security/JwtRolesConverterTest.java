package cl.fullstack3.pedidos360.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtRolesConverterTest {

    private final JwtRolesConverter converter = new JwtRolesConverter();

    private Jwt jwtConRoles(List<String> roles) {
        return Jwt.withTokenValue("token")
                .header("alg", "HS256")
                .claim("roles", roles)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    @Test
    void mapeaRolesAAutoridadesConPrefijoRole() {
        var autoridades = converter.convert(jwtConRoles(List.of("Admin", "Operador")));
        assertThat(autoridades).extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_OPERADOR");
    }

    @Test
    void sinRolesDevuelveVacio() {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "HS256")
                .claim("sub", "x")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(3600)).build();
        assertThat(converter.convert(jwt)).isEmpty();
    }
}
