package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class RetoUsuarioDTO {

    private Integer idRetoUsuario;

    @NotNull(message = "El usuario es obligatorio")
    private Integer idUsuario;

    @NotNull(message = "El reto es obligatorio")
    private Integer idReto;

    private String reto;

    private String estado;

    private LocalDate fechaInicio;

    private LocalDate fechaCompletado;

    public RetoUsuarioDTO() {
    }

    public Integer getIdRetoUsuario() {
        return idRetoUsuario;
    }

    public void setIdRetoUsuario(Integer idRetoUsuario) {
        this.idRetoUsuario = idRetoUsuario;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdReto() {
        return idReto;
    }

    public void setIdReto(Integer idReto) {
        this.idReto = idReto;
    }

    public String getReto() {
        return reto;
    }

    public void setReto(String reto) {
        this.reto = reto;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaCompletado() {
        return fechaCompletado;
    }

    public void setFechaCompletado(LocalDate fechaCompletado) {
        this.fechaCompletado = fechaCompletado;
    }
}
