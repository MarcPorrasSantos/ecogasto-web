package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class PublicacionDTO {

    private Integer idPublicacion;

    @NotNull(message = "El usuario es obligatorio")
    private Integer idUsuario;

    private String username;

    @NotBlank(message = "Escribe algo para publicar")
    @Size(max = 500, message = "Maximo 500 caracteres")
    private String contenido;

    private String imagenUrl;

    private LocalDateTime fecha;

    public PublicacionDTO() {
    }

    public Integer getIdPublicacion() {
        return idPublicacion;
    }

    public void setIdPublicacion(Integer idPublicacion) {
        this.idPublicacion = idPublicacion;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
