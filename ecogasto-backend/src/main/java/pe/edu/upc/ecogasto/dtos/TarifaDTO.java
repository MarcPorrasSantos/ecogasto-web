package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class TarifaDTO {

    private Integer idTarifa;

    @NotNull(message = "El recurso es obligatorio")
    private Integer idRecurso;

    private String recurso;

    @NotNull(message = "La zona es obligatoria")
    private Integer idZona;

    private String zona;

    @NotNull(message = "La tarifa es obligatoria")
    @PositiveOrZero(message = "La tarifa no puede ser negativa")
    private Double tarifa;

    @NotNull(message = "El umbral bajo es obligatorio")
    @PositiveOrZero(message = "El umbral bajo no puede ser negativo")
    private Double umbralBajo;

    @NotNull(message = "El umbral alto es obligatorio")
    private Double umbralAlto;

    @NotNull(message = "El promedio nacional es obligatorio")
    private Double promedioNacional;

    public TarifaDTO() {
    }

    public Integer getIdTarifa() {
        return idTarifa;
    }

    public void setIdTarifa(Integer idTarifa) {
        this.idTarifa = idTarifa;
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

    public Integer getIdZona() {
        return idZona;
    }

    public void setIdZona(Integer idZona) {
        this.idZona = idZona;
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }

    public Double getTarifa() {
        return tarifa;
    }

    public void setTarifa(Double tarifa) {
        this.tarifa = tarifa;
    }

    public Double getUmbralBajo() {
        return umbralBajo;
    }

    public void setUmbralBajo(Double umbralBajo) {
        this.umbralBajo = umbralBajo;
    }

    public Double getUmbralAlto() {
        return umbralAlto;
    }

    public void setUmbralAlto(Double umbralAlto) {
        this.umbralAlto = umbralAlto;
    }

    public Double getPromedioNacional() {
        return promedioNacional;
    }

    public void setPromedioNacional(Double promedioNacional) {
        this.promedioNacional = promedioNacional;
    }
}
