package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class EcoTipDTO {

    private Integer idTip;

    @NotNull(message = "El recurso es obligatorio")
    private Integer idRecurso;

    private String recurso;

    @NotBlank(message = "El segmento es obligatorio")
    private String segmento;

    @NotBlank(message = "El texto es obligatorio")
    @Size(max = 300, message = "Maximo 300 caracteres")
    private String texto;

    private Boolean activo;

    public EcoTipDTO() {
    }

    public Integer getIdTip() {
        return idTip;
    }

    public void setIdTip(Integer idTip) {
        this.idTip = idTip;
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

    public String getSegmento() {
        return segmento;
    }

    public void setSegmento(String segmento) {
        this.segmento = segmento;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
