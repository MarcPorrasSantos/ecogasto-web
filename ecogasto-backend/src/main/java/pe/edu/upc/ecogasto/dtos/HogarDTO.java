package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;
import java.util.List;

public class HogarDTO {

    private Integer idHogar;

    @NotNull(message = "El usuario es obligatorio")
    private Integer idUsuario;

    @NotNull(message = "Selecciona tu zona")
    private Integer idZona;

    private String zona;

    private Boolean esPadre;

    @NotNull(message = "Indica el numero de personas")
    @Min(value = 1, message = "Debe haber al menos 1 persona")
    @Max(value = 20, message = "Maximo 20 personas")
    private Integer numPersonas;

    @NotEmpty(message = "Marca al menos un servicio disponible")
    private List<Integer> recursos;

    public HogarDTO() {
    }

    public Integer getIdHogar() {
        return idHogar;
    }

    public void setIdHogar(Integer idHogar) {
        this.idHogar = idHogar;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdZona() {
        return idZona;
    }

    public void setIdZona(Integer idZona) {
        this.idZona = idZona;
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }

    public Boolean getEsPadre() {
        return esPadre;
    }

    public void setEsPadre(Boolean esPadre) {
        this.esPadre = esPadre;
    }

    public Integer getNumPersonas() {
        return numPersonas;
    }

    public void setNumPersonas(Integer numPersonas) {
        this.numPersonas = numPersonas;
    }

    public List<Integer> getRecursos() {
        return recursos;
    }

    public void setRecursos(List<Integer> recursos) {
        this.recursos = recursos;
    }
}
