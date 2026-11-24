package cl.fullstack3.pedidos360.bff.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Emite tokens HS256 de desarrollo para probar el sistema sin Azure AD.
 * SOLO se activa en modo local (pedidos360.security.mode=local). En produccion
 * (modo oidc) el login real se hace con MSAL contra Azure AD y este endpoint no existe.
 */
@RestController
@RequestMapping("/api/auth")
@ConditionalOnProperty(name = "pedidos360.security.mode", havingValue = "local", matchIfMissing = true)
@Tag(name = "Auth (dev)", description = "Emision de tokens de desarrollo (solo modo local)")
public class DevTokenController {

    private final ObjectMapper objectMapper;
    private final String secret;

    public DevTokenController(ObjectMapper objectMapper,
                              @Value("${pedidos360.security.secret:cambia-este-secreto-de-desarrollo-pedidos360-hs256-32bytes}") String secret) {
        this.objectMapper = objectMapper;
        this.secret = secret;
    }

    @GetMapping("/dev-token")
    @Operation(summary = "Obtener un token de desarrollo para un rol (ADMIN, OPERADOR o CLIENTE)")
    public Map<String, Object> devToken(@RequestParam(defaultValue = "ADMIN") String role,
                                        @RequestParam(defaultValue = "demo@pedidos360.cl") String user) throws Exception {
        long now = Instant.now().getEpochSecond();
        long exp = now + 3600;

        String header = b64(objectMapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
        String payload = b64(objectMapper.writeValueAsBytes(Map.of(
                "sub", user,
                "preferred_username", user,
                "name", user,
                "roles", List.of(role.toUpperCase()),
                "iat", now,
                "exp", exp)));
        String firmaInput = header + "." + payload;

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String firma = b64(mac.doFinal(firmaInput.getBytes(StandardCharsets.UTF_8)));

        return Map.of(
                "token", firmaInput + "." + firma,
                "role", role.toUpperCase(),
                "user", user,
                "expiresIn", 3600);
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
