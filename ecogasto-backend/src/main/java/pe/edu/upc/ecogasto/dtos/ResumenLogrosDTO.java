package pe.edu.upc.ecogasto.dtos;

public class ResumenLogrosDTO {

    private Integer puntos;

    private Integer retosCompletados;

    private Integer insignias;

    private Double costoUltimoMes;

    private Double costoMesAnterior;

    private Double variacionPct;

    public ResumenLogrosDTO() {
    }

    public Integer getPuntos() {
        return puntos;
    }

    public void setPuntos(Integer puntos) {
        this.puntos = puntos;
    }

    public Integer getRetosCompletados() {
        return retosCompletados;
    }

    public void setRetosCompletados(Integer retosCompletados) {
        this.retosCompletados = retosCompletados;
    }

    public Integer getInsignias() {
        return insignias;
    }

    public void setInsignias(Integer insignias) {
        this.insignias = insignias;
    }

    public Double getCostoUltimoMes() {
        return costoUltimoMes;
    }

    public void setCostoUltimoMes(Double costoUltimoMes) {
        this.costoUltimoMes = costoUltimoMes;
    }

    public Double getCostoMesAnterior() {
        return costoMesAnterior;
    }

    public void setCostoMesAnterior(Double costoMesAnterior) {
        this.costoMesAnterior = costoMesAnterior;
    }

    public Double getVariacionPct() {
        return variacionPct;
    }

    public void setVariacionPct(Double variacionPct) {
        this.variacionPct = variacionPct;
    }
}
