package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class RegistroDTO {

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 4, max = 40, message = "El usuario debe tener entre 4 y 40 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email invalido")
    private String email;

    @NotBlank(message = "La contrasena es obligatoria")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", message = "Minimo 8 caracteres, con mayuscula, minuscula y numero")
    private String password;

    @NotBlank(message = "Confirma tu contrasena")
    private String confirmarPassword;

    @NotNull(message = "Debes aceptar los terminos y condiciones")
    @AssertTrue(message = "Debes aceptar los terminos y condiciones")
    private Boolean aceptaTerminos;

    public RegistroDTO() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmarPassword() {
        return confirmarPassword;
    }

    public void setConfirmarPassword(String confirmarPassword) {
        this.confirmarPassword = confirmarPassword;
    }

    public Boolean getAceptaTerminos() {
        return aceptaTerminos;
    }

    public void setAceptaTerminos(Boolean aceptaTerminos) {
        this.aceptaTerminos = aceptaTerminos;
    }
}
