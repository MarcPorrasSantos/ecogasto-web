package pe.edu.upc.ecogasto.dtos;

public class ImpactoDTO {

    private String recurso;

    private Double valor;

    private String unidad;

    private Double co2Kg;

    private Double litrosMes;

    public ImpactoDTO() {
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public Double getCo2Kg() {
        return co2Kg;
    }

    public void setCo2Kg(Double co2Kg) {
        this.co2Kg = co2Kg;
    }

    public Double getLitrosMes() {
        return litrosMes;
    }

    public void setLitrosMes(Double litrosMes) {
        this.litrosMes = litrosMes;
    }
}
