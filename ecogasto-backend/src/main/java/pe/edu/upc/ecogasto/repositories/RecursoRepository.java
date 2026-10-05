package pe.edu.upc.ecogasto.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Recurso;

@Repository
public interface RecursoRepository extends JpaRepository<Recurso, Integer> {

}
