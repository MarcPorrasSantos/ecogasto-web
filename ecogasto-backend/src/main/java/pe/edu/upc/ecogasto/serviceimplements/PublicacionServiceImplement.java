package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.PublicacionDTO;
import pe.edu.upc.ecogasto.entities.Publicacion;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.PublicacionRepository;
import pe.edu.upc.ecogasto.repositories.UsuarioRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IPublicacionService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PublicacionServiceImplement implements IPublicacionService {

    @Autowired
    private PublicacionRepository pR;
    @Autowired
    private UsuarioRepository uR;

    @Override
    public List<PublicacionDTO> listar() {
        List<PublicacionDTO> lista = new ArrayList<>();
        for (Publicacion p : pR.findAllByOrderByFechaDesc()) {
            lista.add(aDTO(p));
        }
        return lista;
    }

    @Override
    public PublicacionDTO insertar(PublicacionDTO dto) {
        Usuario u = uR.findById(dto.getIdUsuario())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        Publicacion p = new Publicacion();
        p.setUsuario(u);
        p.setContenido(dto.getContenido().trim());
        p.setImagenUrl(dto.getImagenUrl());
        p.setFecha(LocalDateTime.now());
        return aDTO(pR.save(p));
    }

    @Override
    public void eliminar(Integer idPublicacion) {
        if (!pR.existsById(idPublicacion)) {
            throw new NoSuchElementException("Publicacion no encontrada");
        }
        pR.deleteById(idPublicacion);
    }

    private PublicacionDTO aDTO(Publicacion p) {
        PublicacionDTO dto = new PublicacionDTO();
        dto.setIdPublicacion(p.getIdPublicacion());
        dto.setIdUsuario(p.getUsuario().getIdUsuario());
        dto.setUsername(p.getUsuario().getUsername());
        dto.setContenido(p.getContenido());
        dto.setImagenUrl(p.getImagenUrl());
        dto.setFecha(p.getFecha());
        return dto;
    }
}
