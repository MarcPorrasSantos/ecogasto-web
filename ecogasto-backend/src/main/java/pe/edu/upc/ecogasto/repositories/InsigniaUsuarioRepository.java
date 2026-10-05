package pe.edu.upc.ecogasto.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.edu.upc.ecogasto.entities.InsigniaUsuario;

@Repository
public interface InsigniaUsuarioRepository extends JpaRepository<InsigniaUsuario, Integer> {

    List<InsigniaUsuario> findByUsuario_IdUsuarioOrderByFechaObtencionDesc(Integer idUsuario);

    int countByUsuario_IdUsuario(Integer idUsuario);
}
