package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.RegistroDTO;
import pe.edu.upc.ecogasto.dtos.UsuarioDTO;

import java.util.List;

public interface IUsuarioService {

    UsuarioDTO registrar(RegistroDTO dto);              // HU01

    List<UsuarioDTO> listar();                          // HU16

    UsuarioDTO insertar(UsuarioDTO dto);                // HU16

    UsuarioDTO actualizar(Integer idUsuario, UsuarioDTO dto);  // HU16

    void eliminar(Integer idUsuario);                   // HU16

    UsuarioDTO buscarPorUsername(String username);
}
