package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "retos")
public class Reto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reto")
    private Integer idReto;

    @Column(name = "titulo")
    private String titulo;

    @Column(name = "descripcion")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "id_recurso")
    private Recurso recurso;

    @Column(name = "meta_porcentaje")
    private Integer metaPorcentaje;

    @Column(name = "puntos")
    private Integer puntos;

    @Column(name = "activo")
    private Boolean activo;

    public Reto() {
    }

    public Integer getIdReto() {
        return idReto;
    }

    public void setIdReto(Integer idReto) {
        this.idReto = idReto;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Recurso getRecurso() {
        return recurso;
    }

    public void setRecurso(Recurso recurso) {
        this.recurso = recurso;
    }

    public Integer getMetaPorcentaje() {
        return metaPorcentaje;
    }

    public void setMetaPorcentaje(Integer metaPorcentaje) {
        this.metaPorcentaje = metaPorcentaje;
    }

    public Integer getPuntos() {
        return puntos;
    }

    public void setPuntos(Integer puntos) {
        this.puntos = puntos;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
