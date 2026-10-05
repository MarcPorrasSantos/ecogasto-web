package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class PreferenciaDTO {

    @NotNull
    private Boolean notifAgua;

    @NotNull
    private Boolean notifLuz;

    @NotNull
    private Boolean notifGas;

    @NotNull
    private Boolean notifTransporte;

    @NotNull
    private Boolean aceptaRetos;

    @NotNull
    private Boolean recordatorioSemanal;

    public PreferenciaDTO() {
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
