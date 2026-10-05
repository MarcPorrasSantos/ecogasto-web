package pe.edu.upc.ecogasto.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Tarifa;

@Repository
public interface TarifaRepository extends JpaRepository<Tarifa, Integer> {

    Optional<Tarifa> findByRecurso_IdRecursoAndZona_IdZona(Integer idRecurso, Integer idZona);
}
