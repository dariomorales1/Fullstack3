package cl.fullstack3.pedidos360.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/** Valida que el JWT tenga la audiencia esperada (la API registrada en Azure AD). */
public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private final String audiencia;

    public AudienceValidator(String audiencia) {
        this.audiencia = audiencia;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getAudience() != null && jwt.getAudience().contains(audiencia)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "La audiencia requerida no esta presente", null));
    }
}
