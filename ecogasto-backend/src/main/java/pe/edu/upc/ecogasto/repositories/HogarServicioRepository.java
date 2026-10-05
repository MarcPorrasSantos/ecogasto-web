package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.HogarServicio;

@Repository
public interface HogarServicioRepository extends JpaRepository<HogarServicio, Integer> {

    List<HogarServicio> findByHogar_IdHogar(Integer idHogar);

    boolean existsByHogar_IdHogarAndRecurso_IdRecurso(Integer idHogar, Integer idRecurso);

    void deleteByHogar_IdHogar(Integer idHogar);
}
