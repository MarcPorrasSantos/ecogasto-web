package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Reto;

@Repository
public interface RetoRepository extends JpaRepository<Reto, Integer> {

    List<Reto> findByActivoTrue();
}
