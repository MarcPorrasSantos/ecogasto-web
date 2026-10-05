package pe.edu.upc.ecogasto.dtos;

public class SerieConsumoDTO {

    private Integer mes;

    private Double valor;

    private Double promedioNacional;

    public SerieConsumoDTO() {
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

    public Double getPromedioNacional() {
        return promedioNacional;
    }

    public void setPromedioNacional(Double promedioNacional) {
        this.promedioNacional = promedioNacional;
    }
}
