package pe.edu.upc.ecogasto.dtos;

public class MensajeDTO {

    private String mensaje;

    public MensajeDTO() {
    }

    public MensajeDTO(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}
