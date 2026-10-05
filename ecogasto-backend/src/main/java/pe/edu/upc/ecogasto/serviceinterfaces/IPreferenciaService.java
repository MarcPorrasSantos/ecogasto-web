package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.PreferenciaDTO;

public interface IPreferenciaService {

    PreferenciaDTO obtener(Integer idUsuario);                        // HU09

    PreferenciaDTO actualizar(Integer idUsuario, PreferenciaDTO dto); // HU09

    boolean quiereAlertasDe(Integer idUsuario, String recurso);       // usada por HU08
}
