package pe.edu.upc.ecogasto.dtos;

public class IndicadoresDTO {

    private Integer usuarios;

    private Integer hogares;

    private Integer lecturas;

    private Integer alertas;

    private Double pctConCarencia;

    public IndicadoresDTO() {
    }

    public Integer getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(Integer usuarios) {
        this.usuarios = usuarios;
    }

    public Integer getHogares() {
        return hogares;
    }

    public void setHogares(Integer hogares) {
        this.hogares = hogares;
    }

    public Integer getLecturas() {
        return lecturas;
    }

    public void setLecturas(Integer lecturas) {
        this.lecturas = lecturas;
    }

    public Integer getAlertas() {
        return alertas;
    }

    public void setAlertas(Integer alertas) {
        this.alertas = alertas;
    }

    public Double getPctConCarencia() {
        return pctConCarencia;
    }

    public void setPctConCarencia(Double pctConCarencia) {
        this.pctConCarencia = pctConCarencia;
    }
}
