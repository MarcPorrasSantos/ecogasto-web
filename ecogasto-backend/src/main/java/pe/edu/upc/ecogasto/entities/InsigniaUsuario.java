package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "insignias_usuario")
public class InsigniaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_insignia_usuario")
    private Integer idInsigniaUsuario;

    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_insignia")
    private Insignia insignia;

    @Column(name = "fecha_obtencion")
    private LocalDate fechaObtencion;

    public InsigniaUsuario() {
    }

    public Integer getIdInsigniaUsuario() {
        return idInsigniaUsuario;
    }

    public void setIdInsigniaUsuario(Integer idInsigniaUsuario) {
        this.idInsigniaUsuario = idInsigniaUsuario;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Insignia getInsignia() {
        return insignia;
    }

    public void setInsignia(Insignia insignia) {
        this.insignia = insignia;
    }

    public LocalDate getFechaObtencion() {
        return fechaObtencion;
    }

    public void setFechaObtencion(LocalDate fechaObtencion) {
        this.fechaObtencion = fechaObtencion;
    }
}
