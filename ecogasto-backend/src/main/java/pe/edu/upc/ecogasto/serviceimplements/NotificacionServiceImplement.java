package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upc.ecogasto.dtos.NotificacionDTO;
import pe.edu.upc.ecogasto.entities.Notificacion;
import pe.edu.upc.ecogasto.entities.Recurso;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.NotificacionRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.INotificacionService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificacionServiceImplement implements INotificacionService {

    @Autowired
    private NotificacionRepository nR;

    @Override
    public List<NotificacionDTO> listarPorUsuario(Integer idUsuario) {
        List<NotificacionDTO> lista = new ArrayList<>();
        for (Notificacion n : nR.findByUsuario_IdUsuarioOrderByFechaDesc(idUsuario)) {
            NotificacionDTO dto = new NotificacionDTO();
            dto.setIdNotificacion(n.getIdNotificacion());
            dto.setRecurso(n.getRecurso() != null ? n.getRecurso().getNombre() : null);
            dto.setTitulo(n.getTitulo());
            dto.setMensaje(n.getMensaje());
            dto.setLeida(n.getLeida());
            dto.setFecha(n.getFecha());
            lista.add(dto);
        }
        return lista;
    }

    @Override
    @Transactional
    public void marcarTodasLeidas(Integer idUsuario) {
        nR.marcarTodasLeidas(idUsuario);
    }

    @Override
    @Transactional
    public void eliminarTodas(Integer idUsuario) {
        nR.deleteByUsuario_IdUsuario(idUsuario);
    }

    @Override
    public void crear(Usuario usuario, Recurso recurso, String titulo, String mensaje) {
        Notificacion n = new Notificacion();
        n.setUsuario(usuario);
        n.setRecurso(recurso);
        n.setTitulo(titulo);
        n.setMensaje(mensaje.length() > 300 ? mensaje.substring(0, 300) : mensaje);
        n.setLeida(false);
        n.setFecha(LocalDateTime.now());
        nR.save(n);
    }
}
