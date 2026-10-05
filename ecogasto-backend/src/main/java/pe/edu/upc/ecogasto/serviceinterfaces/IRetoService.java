package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.CompletarRetoDTO;
import pe.edu.upc.ecogasto.dtos.InsigniaDTO;
import pe.edu.upc.ecogasto.dtos.RetoDTO;
import pe.edu.upc.ecogasto.dtos.RetoUsuarioDTO;

import java.util.List;

public interface IRetoService {

    List<RetoDTO> listar();                                    // HU18

    List<RetoDTO> listarActivos();                             // HU12

    RetoDTO insertar(RetoDTO dto);                             // HU18

    RetoDTO actualizar(Integer idReto, RetoDTO dto);           // HU18

    void eliminar(Integer idReto);                             // HU18

    RetoUsuarioDTO unirse(RetoUsuarioDTO dto);                 // HU12

    List<RetoUsuarioDTO> listarPorUsuario(Integer idUsuario);  // HU12

    CompletarRetoDTO completar(Integer idRetoUsuario);         // HU12

    List<InsigniaDTO> insigniasPorUsuario(Integer idUsuario);  // HU12
}
