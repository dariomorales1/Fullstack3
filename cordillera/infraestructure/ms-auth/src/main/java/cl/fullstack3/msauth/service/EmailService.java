package cl.fullstack3.msauth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final WebClient.Builder webClientBuilder;

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetToken, String frontendUrl) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String htmlBody = buildResetHtml(resetLink, toEmail);
        Map<String, Object> payload = Map.of(
                "from", fromEmail,
                "to", new String[]{ toEmail },
                "subject", "Grupo Cordillera - Recuperacion de contrasena",
                "html", htmlBody
        );

        try {
            webClientBuilder.build()
                    .post()
                    .uri("https://api.resend.com/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Correo de recuperacion enviado a {}", toEmail);
        } catch (Exception ex) {
            log.error("Error enviando correo de recuperacion a {}", toEmail, ex);
            throw new RuntimeException("No fue posible enviar el correo de recuperacion", ex);
        }
    }

    private String buildResetHtml(String resetLink, String toEmail) {
        return """
                <div style="font-family:Arial,sans-serif;color:#0f172a">
                  <h2>Recuperacion de contrasena</h2>
                  <p>Hola %s,</p>
                  <p>Recibimos una solicitud para restablecer tu contrasena.</p>
                  <p>
                    <a href="%s" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Restablecer contrasena
                    </a>
                  </p>
                  <p>Este enlace expira en 1 hora.</p>
                  <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                </div>
                """.formatted(toEmail, resetLink);
    }
}
