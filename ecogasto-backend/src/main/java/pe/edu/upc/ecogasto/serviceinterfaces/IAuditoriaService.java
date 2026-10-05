package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.AuditoriaDTO;
import pe.edu.upc.ecogasto.entities.Usuario;

import java.util.List;

public interface IAuditoriaService {

    void registrar(String accion, String tabla, String detalle);

    void registrar(Usuario usuario, String accion, String tabla, String detalle);

    List<AuditoriaDTO> listar();   // HU15
}
