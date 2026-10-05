package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Zona;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, Integer> {

    List<Zona> findByActivaTrue();
}
