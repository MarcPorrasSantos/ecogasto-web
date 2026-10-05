package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "hogar_servicios")
public class HogarServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_hogar_servicio")
    private Integer idHogarServicio;

    @ManyToOne
    @JoinColumn(name = "id_hogar")
    private Hogar hogar;

    @ManyToOne
    @JoinColumn(name = "id_recurso")
    private Recurso recurso;

    public HogarServicio() {
    }

    public Integer getIdHogarServicio() {
        return idHogarServicio;
    }

    public void setIdHogarServicio(Integer idHogarServicio) {
        this.idHogarServicio = idHogarServicio;
    }

    public Hogar getHogar() {
        return hogar;
    }

    public void setHogar(Hogar hogar) {
        this.hogar = hogar;
    }

    public Recurso getRecurso() {
        return recurso;
    }

    public void setRecurso(Recurso recurso) {
        this.recurso = recurso;
    }
}
