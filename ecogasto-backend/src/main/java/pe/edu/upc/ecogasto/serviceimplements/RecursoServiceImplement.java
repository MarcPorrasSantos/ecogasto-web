package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.RecursoDTO;
import pe.edu.upc.ecogasto.entities.Recurso;
import pe.edu.upc.ecogasto.repositories.RecursoRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IRecursoService;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecursoServiceImplement implements IRecursoService {

    @Autowired
    private RecursoRepository rR;

    @Override
    public List<RecursoDTO> listar() {
        List<RecursoDTO> lista = new ArrayList<>();
        for (Recurso r : rR.findAll()) {
            RecursoDTO dto = new RecursoDTO();
            dto.setIdRecurso(r.getIdRecurso());
            dto.setNombre(r.getNombre());
            dto.setUnidad(r.getUnidad());
            dto.setFactorCo2(r.getFactorCo2());
            lista.add(dto);
        }
        return lista;
    }
}
