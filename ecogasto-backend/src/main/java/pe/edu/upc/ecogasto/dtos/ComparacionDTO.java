package pe.edu.upc.ecogasto.dtos;


public class ComparacionDTO {

    private String recurso;

    private Double miValor;

    private Double promedioReferencia;

    private Double diferenciaPct;

    private Integer cantidadHogares;

    public ComparacionDTO() {
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public Double getMiValor() {
        return miValor;
    }

    public void setMiValor(Double miValor) {
        this.miValor = miValor;
    }

    public Double getPromedioReferencia() {
        return promedioReferencia;
    }

    public void setPromedioReferencia(Double promedioReferencia) {
        this.promedioReferencia = promedioReferencia;
    }

    public Double getDiferenciaPct() {
        return diferenciaPct;
    }

    public void setDiferenciaPct(Double diferenciaPct) {
        this.diferenciaPct = diferenciaPct;
    }

    public Integer getCantidadHogares() {
        return cantidadHogares;
    }

    public void setCantidadHogares(Integer cantidadHogares) {
        this.cantidadHogares = cantidadHogares;
    }
}
