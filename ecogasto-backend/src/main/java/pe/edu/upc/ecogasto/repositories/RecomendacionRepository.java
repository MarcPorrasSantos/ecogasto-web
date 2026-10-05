package pe.edu.upc.ecogasto.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Recomendacion;

@Repository
public interface RecomendacionRepository extends JpaRepository<Recomendacion, Integer> {

}
