package pe.edu.upc.ecogasto.dtos;

import java.time.LocalDateTime;

public class RecomendacionDTO {

    private Integer idRecomendacion;

    private String recurso;

    private String texto;

    private String origen;

    private Boolean util;

    private LocalDateTime fecha;

    public RecomendacionDTO() {
    }

    public Integer getIdRecomendacion() {
        return idRecomendacion;
    }

    public void setIdRecomendacion(Integer idRecomendacion) {
        this.idRecomendacion = idRecomendacion;
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public Boolean getUtil() {
        return util;
    }

    public void setUtil(Boolean util) {
        this.util = util;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
