package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.EcoTipDTO;
import pe.edu.upc.ecogasto.entities.EcoTip;
import pe.edu.upc.ecogasto.repositories.EcoTipRepository;
import pe.edu.upc.ecogasto.repositories.RecursoRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IEcoTipService;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EcoTipServiceImplement implements IEcoTipService {

    @Autowired
    private EcoTipRepository etR;
    @Autowired
    private RecursoRepository rR;

    @Override
    public List<EcoTipDTO> listar() {
        List<EcoTipDTO> lista = new ArrayList<>();
        for (EcoTip t : etR.findAll()) {
            lista.add(aDTO(t));
        }
        return lista;
    }

    @Override
    public List<EcoTipDTO> listarPorRecurso(Integer idRecurso) {
        List<EcoTipDTO> lista = new ArrayList<>();
        for (EcoTip t : etR.findByRecurso_IdRecursoAndActivoTrue(idRecurso)) {
            lista.add(aDTO(t));
        }
        return lista;
    }

    @Override
    public EcoTipDTO insertar(EcoTipDTO dto) {
        EcoTip t = new EcoTip();
        llenar(t, dto);
        return aDTO(etR.save(t));
    }

    @Override
    public EcoTipDTO actualizar(Integer idTip, EcoTipDTO dto) {
        EcoTip t = etR.findById(idTip).orElseThrow(() -> new NoSuchElementException("Tip no encontrado"));
        llenar(t, dto);
        return aDTO(etR.save(t));
    }

    @Override
    public void eliminar(Integer idTip) {
        if (!etR.existsById(idTip)) {
            throw new NoSuchElementException("Tip no encontrado");
        }
        etR.deleteById(idTip);
    }

    private void llenar(EcoTip t, EcoTipDTO dto) {
        t.setRecurso(rR.findById(dto.getIdRecurso()).orElseThrow(() -> new NoSuchElementException("Recurso no encontrado")));
        t.setSegmento(dto.getSegmento());
        t.setTexto(dto.getTexto());
        t.setActivo(dto.getActivo() == null || dto.getActivo());
    }

    private EcoTipDTO aDTO(EcoTip t) {
        EcoTipDTO dto = new EcoTipDTO();
        dto.setIdTip(t.getIdTip());
        dto.setIdRecurso(t.getRecurso().getIdRecurso());
        dto.setRecurso(t.getRecurso().getNombre());
        dto.setSegmento(t.getSegmento());
        dto.setTexto(t.getTexto());
        dto.setActivo(t.getActivo());
        return dto;
    }
}
