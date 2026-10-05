package pe.edu.upc.ecogasto.dtos;

public class NivelConsumoDTO {

    private String recurso;

    private Integer bajo;

    private Integer moderado;

    private Integer alto;

    public NivelConsumoDTO() {
    }

    public String getRecurso() {
        return recurso;
    }

    public void setRecurso(String recurso) {
        this.recurso = recurso;
    }

    public Integer getBajo() {
        return bajo;
    }

    public void setBajo(Integer bajo) {
        this.bajo = bajo;
    }

    public Integer getModerado() {
        return moderado;
    }

    public void setModerado(Integer moderado) {
        this.moderado = moderado;
    }

    public Integer getAlto() {
        return alto;
    }

    public void setAlto(Integer alto) {
        this.alto = alto;
    }
}
