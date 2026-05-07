package cl.fullstack3.msauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequestDTO {

    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 6, message = "La contrasena debe tener al menos 6 caracteres")
    private String newPassword;
}
