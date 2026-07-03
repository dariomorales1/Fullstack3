package cl.fullstack3.msauth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

    private String token;
    private String email;
    private String role;
    private long expiresIn;
}
