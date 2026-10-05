package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Notificacion;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {

    List<Notificacion> findByUsuario_IdUsuarioOrderByFechaDesc(Integer idUsuario);

    void deleteByUsuario_IdUsuario(Integer idUsuario);

    @Modifying
    @Query(value = "UPDATE notificaciones SET leida = TRUE WHERE id_usuario = :idUsuario", nativeQuery = true)
    void marcarTodasLeidas(@Param("idUsuario") Integer idUsuario);
}
