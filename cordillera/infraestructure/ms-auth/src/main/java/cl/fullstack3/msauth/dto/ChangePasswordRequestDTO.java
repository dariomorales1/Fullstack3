package cl.fullstack3.msauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequestDTO {

    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 6, message = "La nueva contrasena debe tener al menos 6 caracteres")
    private String newPassword;
}
