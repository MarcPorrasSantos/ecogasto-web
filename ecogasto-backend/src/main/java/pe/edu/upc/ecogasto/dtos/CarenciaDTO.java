package pe.edu.upc.ecogasto.dtos;

public class CarenciaDTO {

    private String zona;

    private String recurso;

    private Integer totalHogares;

    private Integer sinServicio;

    private Double porcentaje;

    public CarenciaDTO() {
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public Integer getTotalHogares() {
        return totalHogares;
    }

    public void setTotalHogares(Integer totalHogares) {
        this.totalHogares = totalHogares;
    }

    public Integer getSinServicio() {
        return sinServicio;
    }

    public void setSinServicio(Integer sinServicio) {
        this.sinServicio = sinServicio;
    }

    public Double getPorcentaje() {
        return porcentaje;
    }

    public void setPorcentaje(Double porcentaje) {
        this.porcentaje = porcentaje;
    }
}
