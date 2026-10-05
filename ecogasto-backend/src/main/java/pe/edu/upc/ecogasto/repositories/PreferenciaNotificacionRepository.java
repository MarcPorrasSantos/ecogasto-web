package pe.edu.upc.ecogasto.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.PreferenciaNotificacion;

@Repository
public interface PreferenciaNotificacionRepository extends JpaRepository<PreferenciaNotificacion, Integer> {

    Optional<PreferenciaNotificacion> findByUsuario_IdUsuario(Integer idUsuario);
}
