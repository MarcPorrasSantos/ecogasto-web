package pe.edu.upc.ecogasto.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Consumo;

import java.util.List;

@Repository
public interface ReporteRepository extends JpaRepository<Consumo, Integer> {

    @Query(value =
            "SELECT r.nombre, c.valor, r.unidad, " +
            "ROUND(CASE WHEN r.nombre = 'Agua' THEN c.valor * h.num_personas * 30 * r.factor_co2 ELSE c.valor * r.factor_co2 END, 2) AS co2_kg, " +
            "CASE WHEN r.nombre = 'Agua' THEN c.valor * h.num_personas * 30 ELSE 0 END AS litros_mes " +
            "FROM consumos c " +
            "JOIN recursos r ON r.id_recurso = c.id_recurso " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "WHERE c.id_hogar = :idHogar AND c.anio = :anio AND c.mes = :mes " +
            "ORDER BY r.id_recurso",
            nativeQuery = true)
    List<Object[]> impactoAmbiental(@Param("idHogar") Integer idHogar, @Param("anio") Integer anio, @Param("mes") Integer mes);

    @Query(value =
            "SELECT r.nombre, c.valor, t.promedio_nacional, " +
            "ROUND((c.valor - t.promedio_nacional) * 100 / t.promedio_nacional, 1) AS diferencia_pct " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "JOIN tarifas t ON t.id_recurso = c.id_recurso AND t.id_zona = h.id_zona " +
            "JOIN recursos r ON r.id_recurso = c.id_recurso " +
            "WHERE c.id_hogar = :idHogar AND c.anio = :anio AND c.mes = :mes " +
            "ORDER BY r.id_recurso",
            nativeQuery = true)
    List<Object[]> comparacionNacional(@Param("idHogar") Integer idHogar, @Param("anio") Integer anio, @Param("mes") Integer mes);

    @Query(value =
            "SELECT r.nombre, mio.valor, ROUND(AVG(otro.valor), 2) AS promedio_similares, COUNT(otro.id_consumo) AS hogares " +
            "FROM consumos mio " +
            "JOIN hogares hm ON hm.id_hogar = mio.id_hogar " +
            "JOIN hogares ho ON ho.id_zona = hm.id_zona AND ABS(ho.num_personas - hm.num_personas) <= 1 AND ho.id_hogar <> hm.id_hogar " +
            "JOIN consumos otro ON otro.id_hogar = ho.id_hogar AND otro.id_recurso = mio.id_recurso AND otro.anio = mio.anio AND otro.mes = mio.mes " +
            "JOIN recursos r ON r.id_recurso = mio.id_recurso " +
            "WHERE mio.id_hogar = :idHogar AND mio.anio = :anio AND mio.mes = :mes " +
            "GROUP BY r.id_recurso, r.nombre, mio.valor " +
            "ORDER BY r.id_recurso",
            nativeQuery = true)
    List<Object[]> hogaresSimilares(@Param("idHogar") Integer idHogar, @Param("anio") Integer anio, @Param("mes") Integer mes);

    @Query(value =
            "SELECT z.nombre AS zona, c.mes, r.nombre AS recurso, ROUND(AVG(c.valor), 2) AS promedio " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "JOIN zonas z ON z.id_zona = h.id_zona " +
            "JOIN recursos r ON r.id_recurso = c.id_recurso " +
            "WHERE h.id_zona = :idZona AND c.anio = :anio " +
            "GROUP BY z.nombre, c.mes, r.id_recurso, r.nombre " +
            "ORDER BY c.mes, r.id_recurso",
            nativeQuery = true)
    List<Object[]> promedioMensualZona(@Param("idZona") Integer idZona, @Param("anio") Integer anio);

    @Query(value =
            "SELECT z.nombre AS zona, c.mes, r.nombre AS recurso, ROUND(AVG(c.valor), 2) AS promedio " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "JOIN zonas z ON z.id_zona = h.id_zona " +
            "JOIN recursos r ON r.id_recurso = c.id_recurso " +
            "WHERE c.anio = :anio " +
            "GROUP BY z.id_zona, z.nombre, c.mes, r.id_recurso, r.nombre " +
            "ORDER BY z.id_zona, c.mes, r.id_recurso",
            nativeQuery = true)
    List<Object[]> promedioMensualTodas(@Param("anio") Integer anio);

    @Query(value =
            "SELECT u.username, COALESCE(SUM(re.puntos), 0) AS puntos, z.nombre AS zona, u.segmento " +
            "FROM usuarios u " +
            "JOIN hogares h ON h.id_usuario = u.id_usuario " +
            "JOIN zonas z ON z.id_zona = h.id_zona " +
            "LEFT JOIN retos_usuario ru ON ru.id_usuario = u.id_usuario AND ru.estado = 'COMPLETADO' " +
            "LEFT JOIN retos re ON re.id_reto = ru.id_reto " +
            "WHERE (:zona = '' OR z.nombre = :zona) AND (:segmento = '' OR u.segmento = :segmento) " +
            "GROUP BY u.id_usuario, u.username, z.nombre, u.segmento " +
            "ORDER BY puntos DESC, u.username " +
            "LIMIT 10",
            nativeQuery = true)
    List<Object[]> ranking(@Param("zona") String zona, @Param("segmento") String segmento);

    @Query(value =
            "SELECT c.anio, c.mes, SUM(c.costo_estimado) AS costo " +
            "FROM consumos c " +
            "JOIN hogares h ON h.id_hogar = c.id_hogar " +
            "WHERE h.id_usuario = :idUsuario " +
            "GROUP BY c.anio, c.mes " +
            "ORDER BY c.anio DESC, c.mes DESC " +
            "LIMIT 2",
            nativeQuery = true)
    List<Object[]> costosUltimosMeses(@Param("idUsuario") Integer idUsuario);

    @Query(value =
            "SELECT " +
            "(SELECT COUNT(*) FROM usuarios u JOIN roles ro ON ro.id_rol = u.id_rol WHERE ro.nombre = 'USER') AS usuarios, " +
            "(SELECT COUNT(*) FROM hogares) AS hogares, " +
            "(SELECT COUNT(*) FROM consumos) AS lecturas, " +
            "(SELECT COUNT(*) FROM notificaciones WHERE titulo LIKE 'Alerta%') AS alertas, " +
            "(SELECT ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM hogares), 0), 1) FROM hogares h " +
            "WHERE (SELECT COUNT(*) FROM hogar_servicios hs WHERE hs.id_hogar = h.id_hogar) < (SELECT COUNT(*) FROM recursos)) AS pct_con_carencia",
            nativeQuery = true)
    List<Object[]> indicadores();

    @Query(value =
            "SELECT r.nombre, " +
            "SUM(CASE WHEN p.promedio < t.umbral_bajo THEN 1 ELSE 0 END) AS bajo, " +
            "SUM(CASE WHEN p.promedio >= t.umbral_bajo AND p.promedio < t.umbral_alto THEN 1 ELSE 0 END) AS moderado, " +
            "SUM(CASE WHEN p.promedio >= t.umbral_alto THEN 1 ELSE 0 END) AS alto " +
            "FROM (SELECT c.id_hogar, c.id_recurso, AVG(c.valor) AS promedio FROM consumos c GROUP BY c.id_hogar, c.id_recurso) p " +
            "JOIN hogares h ON h.id_hogar = p.id_hogar " +
            "JOIN tarifas t ON t.id_recurso = p.id_recurso AND t.id_zona = h.id_zona " +
            "JOIN recursos r ON r.id_recurso = p.id_recurso " +
            "GROUP BY r.id_recurso, r.nombre " +
            "ORDER BY r.id_recurso",
            nativeQuery = true)
    List<Object[]> nivelConsumo();

    @Query(value =
            "SELECT z.nombre AS zona, r.nombre AS recurso, COUNT(h.id_hogar) AS total_hogares, " +
            "SUM(CASE WHEN hs.id_hogar_servicio IS NULL THEN 1 ELSE 0 END) AS sin_servicio, " +
            "ROUND(100.0 * SUM(CASE WHEN hs.id_hogar_servicio IS NULL THEN 1 ELSE 0 END) / COUNT(h.id_hogar), 1) AS porcentaje " +
            "FROM hogares h " +
            "JOIN zonas z ON z.id_zona = h.id_zona " +
            "CROSS JOIN recursos r " +
            "LEFT JOIN hogar_servicios hs ON hs.id_hogar = h.id_hogar AND hs.id_recurso = r.id_recurso " +
            "GROUP BY z.id_zona, z.nombre, r.id_recurso, r.nombre " +
            "ORDER BY z.id_zona, r.id_recurso",
            nativeQuery = true)
    List<Object[]> carenciasPorZona();
}
