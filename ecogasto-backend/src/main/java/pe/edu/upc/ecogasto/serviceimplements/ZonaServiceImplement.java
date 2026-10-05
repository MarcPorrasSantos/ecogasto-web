package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.ZonaDTO;
import pe.edu.upc.ecogasto.entities.Zona;
import pe.edu.upc.ecogasto.repositories.ZonaRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IZonaService;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ZonaServiceImplement implements IZonaService {

    @Autowired
    private ZonaRepository zR;

    @Override
    public List<ZonaDTO> listar() {
        return aLista(zR.findAll());
    }

    @Override
    public List<ZonaDTO> listarActivas() {
        return aLista(zR.findByActivaTrue());
    }

    @Override
    public ZonaDTO insertar(ZonaDTO dto) {
        Zona z = new Zona();
        z.setNombre(dto.getNombre());
        z.setDescripcion(dto.getDescripcion());
        z.setActiva(dto.getActiva() == null || dto.getActiva());
        return aDTO(zR.save(z));
    }

    @Override
    public ZonaDTO actualizar(Integer idZona, ZonaDTO dto) {
        Zona z = zR.findById(idZona).orElseThrow(() -> new NoSuchElementException("Zona no encontrada"));
        z.setNombre(dto.getNombre());
        z.setDescripcion(dto.getDescripcion());
        if (dto.getActiva() != null) {
            z.setActiva(dto.getActiva());
        }
        return aDTO(zR.save(z));
    }

    @Override
    public void eliminar(Integer idZona) {
        if (!zR.existsById(idZona)) {
            throw new NoSuchElementException("Zona no encontrada");
        }
        zR.deleteById(idZona);
    }

    private List<ZonaDTO> aLista(List<Zona> zonas) {
        List<ZonaDTO> lista = new ArrayList<>();
        for (Zona z : zonas) {
            lista.add(aDTO(z));
        }
        return lista;
    }

    private ZonaDTO aDTO(Zona z) {
        ZonaDTO dto = new ZonaDTO();
        dto.setIdZona(z.getIdZona());
        dto.setNombre(z.getNombre());
        dto.setDescripcion(z.getDescripcion());
        dto.setActiva(z.getActiva());
        return dto;
    }
}
