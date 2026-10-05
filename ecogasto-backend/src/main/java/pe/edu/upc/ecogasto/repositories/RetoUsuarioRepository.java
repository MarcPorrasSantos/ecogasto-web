package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.RetoUsuario;

@Repository
public interface RetoUsuarioRepository extends JpaRepository<RetoUsuario, Integer> {

    List<RetoUsuario> findByUsuario_IdUsuario(Integer idUsuario);

    boolean existsByUsuario_IdUsuarioAndReto_IdReto(Integer idUsuario, Integer idReto);

    int countByUsuario_IdUsuarioAndEstado(Integer idUsuario, String estado);

    @Query(value =
            "SELECT COALESCE(SUM(re.puntos), 0) FROM retos_usuario ru " +
            "JOIN retos re ON re.id_reto = ru.id_reto " +
            "WHERE ru.id_usuario = :idUsuario AND ru.estado = 'COMPLETADO'",
            nativeQuery = true)
    Integer puntosTotales(@Param("idUsuario") Integer idUsuario);
}
