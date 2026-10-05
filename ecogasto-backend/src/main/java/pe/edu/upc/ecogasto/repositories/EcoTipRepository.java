package pe.edu.upc.ecogasto.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.EcoTip;

import java.util.List;

@Repository
public interface EcoTipRepository extends JpaRepository<EcoTip, Integer> {

    @Query(value =
            "SELECT * FROM eco_tips " +
            "WHERE id_recurso = :idRecurso AND activo = TRUE AND (segmento = 'Todos' OR segmento = :segmento) " +
            "ORDER BY RANDOM() " +
            "LIMIT 1",
            nativeQuery = true)
    EcoTip tipAleatorio(@Param("idRecurso") Integer idRecurso, @Param("segmento") String segmento);

    List<EcoTip> findByRecurso_IdRecursoAndActivoTrue(Integer idRecurso);
}
