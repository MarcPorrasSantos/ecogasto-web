package pe.edu.upc.ecogasto.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "preferencias_notificacion")
public class PreferenciaNotificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_preferencia")
    private Integer idPreferencia;

    @OneToOne
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "notif_agua")
    private Boolean notifAgua;

    @Column(name = "notif_luz")
    private Boolean notifLuz;

    @Column(name = "notif_gas")
    private Boolean notifGas;

    @Column(name = "notif_transporte")
    private Boolean notifTransporte;

    @Column(name = "acepta_retos")
    private Boolean aceptaRetos;

    @Column(name = "recordatorio_semanal")
    private Boolean recordatorioSemanal;

    public PreferenciaNotificacion() {
    }

    public Integer getIdPreferencia() {
        return idPreferencia;
    }

    public void setIdPreferencia(Integer idPreferencia) {
        this.idPreferencia = idPreferencia;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Boolean getNotifAgua() {
        return notifAgua;
    }

    public void setNotifAgua(Boolean notifAgua) {
        this.notifAgua = notifAgua;
    }

    public Boolean getNotifLuz() {
        return notifLuz;
    }

    public void setNotifLuz(Boolean notifLuz) {
        this.notifLuz = notifLuz;
    }

    public Boolean getNotifGas() {
        return notifGas;
    }

    public void setNotifGas(Boolean notifGas) {
        this.notifGas = notifGas;
    }

    public Boolean getNotifTransporte() {
        return notifTransporte;
    }

    public void setNotifTransporte(Boolean notifTransporte) {
        this.notifTransporte = notifTransporte;
    }

    public Boolean getAceptaRetos() {
        return aceptaRetos;
    }

    public void setAceptaRetos(Boolean aceptaRetos) {
        this.aceptaRetos = aceptaRetos;
    }

    public Boolean getRecordatorioSemanal() {
        return recordatorioSemanal;
    }

    public void setRecordatorioSemanal(Boolean recordatorioSemanal) {
        this.recordatorioSemanal = recordatorioSemanal;
    }
}
