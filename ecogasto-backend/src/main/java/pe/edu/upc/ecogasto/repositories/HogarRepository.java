package pe.edu.upc.ecogasto.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.Hogar;

@Repository
public interface HogarRepository extends JpaRepository<Hogar, Integer> {

    Optional<Hogar> findByUsuario_IdUsuario(Integer idUsuario);

    boolean existsByUsuario_IdUsuario(Integer idUsuario);
}
