package pe.edu.upc.ecogasto.dtos;

import java.util.List;

public class CompletarRetoDTO {

    private String mensaje;

    private Integer puntosTotales;

    private List<String> insigniasNuevas;

    public CompletarRetoDTO() {
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public Integer getPuntosTotales() {
        return puntosTotales;
    }

    public void setPuntosTotales(Integer puntosTotales) {
        this.puntosTotales = puntosTotales;
    }

    public List<String> getInsigniasNuevas() {
        return insigniasNuevas;
    }

    public void setInsigniasNuevas(List<String> insigniasNuevas) {
        this.insigniasNuevas = insigniasNuevas;
    }
}
