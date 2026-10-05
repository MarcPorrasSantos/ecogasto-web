package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.NotificacionDTO;
import pe.edu.upc.ecogasto.entities.Recurso;
import pe.edu.upc.ecogasto.entities.Usuario;

import java.util.List;

public interface INotificacionService {

    List<NotificacionDTO> listarPorUsuario(Integer idUsuario);   // HU08

    void marcarTodasLeidas(Integer idUsuario);                   // HU08

    void eliminarTodas(Integer idUsuario);                       // HU08

    void crear(Usuario usuario, Recurso recurso, String titulo, String mensaje);
}
