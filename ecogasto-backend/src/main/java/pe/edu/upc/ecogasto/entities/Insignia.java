package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "insignias")
public class Insignia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_insignia")
    private Integer idInsignia;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "puntos_requeridos")
    private Integer puntosRequeridos;

    @Column(name = "imagen_url")
    private String imagenUrl;

    public Insignia() {
    }

    public Integer getIdInsignia() {
        return idInsignia;
    }

    public void setIdInsignia(Integer idInsignia) {
        this.idInsignia = idInsignia;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getPuntosRequeridos() {
        return puntosRequeridos;
    }

    public void setPuntosRequeridos(Integer puntosRequeridos) {
        this.puntosRequeridos = puntosRequeridos;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }
}
