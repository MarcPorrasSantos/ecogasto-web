package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class ConsumoDTO {

    private Integer idConsumo;

    @NotNull(message = "El hogar es obligatorio")
    private Integer idHogar;

    @NotNull(message = "Selecciona el servicio")
    private Integer idRecurso;

    private String recurso;

    @NotNull(message = "El anio es obligatorio")
    @Min(value = 2024, message = "Anio invalido")
    private Integer anio;

    @NotNull(message = "El mes es obligatorio")
    @Min(value = 1, message = "Mes invalido")
    @Max(value = 12, message = "Mes invalido")
    private Integer mes;

    @NotNull(message = "El consumo es obligatorio")
    @Positive(message = "El consumo debe ser mayor a 0")
    private Double valor;

    private Double costoEstimado;

    private LocalDate fechaRegistro;

    private Boolean alertaGenerada;

    public ConsumoDTO() {
    }

    public Integer getIdConsumo() {
        return idConsumo;
    }

    public void setIdConsumo(Integer idConsumo) {
        this.idConsumo = idConsumo;
    }

    public Integer getIdHogar() {
        return idHogar;
    }

    public void setIdHogar(Integer idHogar) {
        this.idHogar = idHogar;
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

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Integer getMes() {
        return mes;
    }

    public void setMes(Integer mes) {
        this.mes = mes;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public Double getCostoEstimado() {
        return costoEstimado;
    }

    public void setCostoEstimado(Double costoEstimado) {
        this.costoEstimado = costoEstimado;
    }

    public LocalDate getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDate fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public Boolean getAlertaGenerada() {
        return alertaGenerada;
    }

    public void setAlertaGenerada(Boolean alertaGenerada) {
        this.alertaGenerada = alertaGenerada;
    }
}
