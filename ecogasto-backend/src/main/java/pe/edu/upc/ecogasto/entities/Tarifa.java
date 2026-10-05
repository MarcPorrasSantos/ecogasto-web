package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "tarifas")
public class Tarifa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tarifa")
    private Integer idTarifa;

    @ManyToOne
    @JoinColumn(name = "id_recurso")
    private Recurso recurso;

    @ManyToOne
    @JoinColumn(name = "id_zona")
    private Zona zona;

    @Column(name = "tarifa")
    private Double tarifa;

    @Column(name = "umbral_bajo")
    private Double umbralBajo;

    @Column(name = "umbral_alto")
    private Double umbralAlto;

    @Column(name = "promedio_nacional")
    private Double promedioNacional;

    public Tarifa() {
    }

    public Integer getIdTarifa() {
        return idTarifa;
    }

    public void setIdTarifa(Integer idTarifa) {
        this.idTarifa = idTarifa;
    }

    public Recurso getRecurso() {
        return recurso;
    }

    public void setRecurso(Recurso recurso) {
        this.recurso = recurso;
    }

    public Zona getZona() {
        return zona;
    }

    public void setZona(Zona zona) {
        this.zona = zona;
    }

    public Double getTarifa() {
        return tarifa;
    }

    public void setTarifa(Double tarifa) {
        this.tarifa = tarifa;
    }

    public Double getUmbralBajo() {
        return umbralBajo;
    }

    public void setUmbralBajo(Double umbralBajo) {
        this.umbralBajo = umbralBajo;
    }

    public Double getUmbralAlto() {
        return umbralAlto;
    }

    public void setUmbralAlto(Double umbralAlto) {
        this.umbralAlto = umbralAlto;
    }

    public Double getPromedioNacional() {
        return promedioNacional;
    }

    public void setPromedioNacional(Double promedioNacional) {
        this.promedioNacional = promedioNacional;
    }
}
