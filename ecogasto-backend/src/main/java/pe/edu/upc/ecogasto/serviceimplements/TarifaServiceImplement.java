package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.TarifaDTO;
import pe.edu.upc.ecogasto.entities.Tarifa;
import pe.edu.upc.ecogasto.repositories.RecursoRepository;
import pe.edu.upc.ecogasto.repositories.TarifaRepository;
import pe.edu.upc.ecogasto.repositories.ZonaRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.ITarifaService;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TarifaServiceImplement implements ITarifaService {

    @Autowired
    private TarifaRepository tR;
    @Autowired
    private RecursoRepository rR;
    @Autowired
    private ZonaRepository zR;

    @Override
    public List<TarifaDTO> listar() {
        List<TarifaDTO> lista = new ArrayList<>();
        for (Tarifa t : tR.findAll()) {
            lista.add(aDTO(t));
        }
        return lista;
    }

    @Override
    public TarifaDTO insertar(TarifaDTO dto) {
        if (tR.findByRecurso_IdRecursoAndZona_IdZona(dto.getIdRecurso(), dto.getIdZona()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una tarifa para ese recurso y zona");
        }
        Tarifa t = new Tarifa();
        llenar(t, dto);
        return aDTO(tR.save(t));
    }

    @Override
    public TarifaDTO actualizar(Integer idTarifa, TarifaDTO dto) {
        Tarifa t = tR.findById(idTarifa).orElseThrow(() -> new NoSuchElementException("Tarifa no encontrada"));
        llenar(t, dto);
        return aDTO(tR.save(t));
    }

    @Override
    public void eliminar(Integer idTarifa) {
        if (!tR.existsById(idTarifa)) {
            throw new NoSuchElementException("Tarifa no encontrada");
        }
        tR.deleteById(idTarifa);
    }

    private void llenar(Tarifa t, TarifaDTO dto) {
        if (dto.getUmbralAlto() <= dto.getUmbralBajo()) {
            throw new IllegalArgumentException("El umbral alto debe ser mayor que el umbral bajo");
        }
        t.setRecurso(rR.findById(dto.getIdRecurso()).orElseThrow(() -> new NoSuchElementException("Recurso no encontrado")));
        t.setZona(zR.findById(dto.getIdZona()).orElseThrow(() -> new NoSuchElementException("Zona no encontrada")));
        t.setTarifa(dto.getTarifa());
        t.setUmbralBajo(dto.getUmbralBajo());
        t.setUmbralAlto(dto.getUmbralAlto());
        t.setPromedioNacional(dto.getPromedioNacional());
    }

    private TarifaDTO aDTO(Tarifa t) {
        TarifaDTO dto = new TarifaDTO();
        dto.setIdTarifa(t.getIdTarifa());
        dto.setIdRecurso(t.getRecurso().getIdRecurso());
        dto.setRecurso(t.getRecurso().getNombre());
        dto.setIdZona(t.getZona().getIdZona());
        dto.setZona(t.getZona().getNombre());
        dto.setTarifa(t.getTarifa());
        dto.setUmbralBajo(t.getUmbralBajo());
        dto.setUmbralAlto(t.getUmbralAlto());
        dto.setPromedioNacional(t.getPromedioNacional());
        return dto;
    }
}
