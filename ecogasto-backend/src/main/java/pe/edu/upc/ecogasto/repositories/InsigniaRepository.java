package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Insignia;

@Repository
public interface InsigniaRepository extends JpaRepository<Insignia, Integer> {

    @Query(value =
            "SELECT * FROM insignias i " +
            "WHERE i.puntos_requeridos <= :puntos " +
            "AND i.id_insignia NOT IN (SELECT iu.id_insignia FROM insignias_usuario iu WHERE iu.id_usuario = :idUsuario)",
            nativeQuery = true)
    List<Insignia> insigniasPendientes(@Param("idUsuario") Integer idUsuario, @Param("puntos") Integer puntos);
}
