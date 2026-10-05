package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class RetoDTO {

    private Integer idReto;

    @NotBlank(message = "El titulo es obligatorio")
    private String titulo;

    @NotBlank(message = "La descripcion es obligatoria")
    private String descripcion;

    @NotNull(message = "El recurso es obligatorio")
    private Integer idRecurso;

    private String recurso;

    @NotNull(message = "La meta es obligatoria")
    @Min(value = 1, message = "La meta debe estar entre 1 y 100")
    @Max(value = 100, message = "La meta debe estar entre 1 y 100")
    private Integer metaPorcentaje;

    @NotNull(message = "Los puntos son obligatorios")
    @Positive(message = "Los puntos deben ser mayores a 0")
    private Integer puntos;

    private Boolean activo;

    public RetoDTO() {
    }

    public Integer getIdReto() {
        return idReto;
    }

    public void setIdReto(Integer idReto) {
        this.idReto = idReto;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getIdRecurso() {
        return idRecurso;
    }

    public void setIdRecurso(Integer idRecurso) {
        this.idRecurso = idRecurso;
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public Integer getMetaPorcentaje() {
        return metaPorcentaje;
    }

    public void setMetaPorcentaje(Integer metaPorcentaje) {
        this.metaPorcentaje = metaPorcentaje;
    }

    public Integer getPuntos() {
        return puntos;
    }

    public void setPuntos(Integer puntos) {
        this.puntos = puntos;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
