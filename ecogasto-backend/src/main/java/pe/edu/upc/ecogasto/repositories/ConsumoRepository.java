package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Consumo;

@Repository
public interface ConsumoRepository extends JpaRepository<Consumo, Integer> {

    List<Consumo> findByHogar_IdHogarOrderByAnioDescMesDesc(Integer idHogar);

    boolean existsByHogar_IdHogarAndRecurso_IdRecursoAndAnioAndMes(Integer idHogar, Integer idRecurso, Integer anio, Integer mes);

    @Query(value =
            "SELECT c.mes, c.valor, t.promedio_nacional " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "JOIN tarifas t ON t.id_recurso = c.id_recurso AND t.id_zona = h.id_zona " +
            "WHERE c.id_hogar = :idHogar AND c.id_recurso = :idRecurso AND c.anio = :anio " +
            "ORDER BY c.mes",
            nativeQuery = true)
    List<Object[]> serieMensual(@Param("idHogar") Integer idHogar,
                                @Param("idRecurso") Integer idRecurso,
                                @Param("anio") Integer anio);

    @Query(value =
            "SELECT AVG(c.valor) FROM consumos c " +
            "WHERE c.id_hogar = :idHogar AND c.id_recurso = :idRecurso AND c.id_consumo <> :idConsumo",
            nativeQuery = true)
    Double promedioAnterior(@Param("idHogar") Integer idHogar,
                            @Param("idRecurso") Integer idRecurso,
                            @Param("idConsumo") Integer idConsumo);

    @Query(value =
            "SELECT r.id_recurso, r.nombre, c.valor, t.promedio_nacional, r.unidad " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "JOIN tarifas t ON t.id_recurso = c.id_recurso AND t.id_zona = h.id_zona " +
            "JOIN recursos r ON r.id_recurso = c.id_recurso " +
            "WHERE h.id_usuario = :idUsuario " +
            "AND (c.anio * 100 + c.mes) = (SELECT MAX(c2.anio * 100 + c2.mes) FROM consumos c2 WHERE c2.id_hogar = h.id_hogar) " +
            "ORDER BY c.valor / t.promedio_nacional DESC " +
            "LIMIT 1",
            nativeQuery = true)
    List<Object[]> recursoMasAlto(@Param("idUsuario") Integer idUsuario);

    @Query(value =
            "SELECT c.valor FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "WHERE h.id_usuario = :idUsuario AND c.id_recurso = :idRecurso " +
            "ORDER BY c.anio DESC, c.mes DESC " +
            "LIMIT 2",
            nativeQuery = true)
    List<Number> ultimasLecturas(@Param("idUsuario") Integer idUsuario,
                                 @Param("idRecurso") Integer idRecurso);
}
