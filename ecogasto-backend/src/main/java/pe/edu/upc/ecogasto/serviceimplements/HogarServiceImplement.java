package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upc.ecogasto.dtos.HogarDTO;
import pe.edu.upc.ecogasto.entities.*;
import pe.edu.upc.ecogasto.repositories.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IHogarService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class HogarServiceImplement implements IHogarService {

    @Autowired
    private HogarRepository hR;
    @Autowired
    private HogarServicioRepository hsR;
    @Autowired
    private UsuarioRepository uR;
    @Autowired
    private ZonaRepository zR;
    @Autowired
    private RecursoRepository rR;

    @Override
    @Transactional
    public HogarDTO registrar(HogarDTO dto) {
        Usuario usuario = uR.findById(dto.getIdUsuario())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        if (hR.existsByUsuario_IdUsuario(dto.getIdUsuario())) {
            throw new IllegalArgumentException("El usuario ya registro su hogar");
        }
        Hogar hogar = new Hogar();
        hogar.setUsuario(usuario);
        llenarDatos(hogar, dto);
        hR.save(hogar);
        guardarServicios(hogar, dto.getRecursos());
        actualizarSegmento(usuario, dto.getEsPadre());
        return aDTO(hogar);
    }

    @Override
    public HogarDTO buscarPorUsuario(Integer idUsuario) {
        Hogar hogar = hR.findByUsuario_IdUsuario(idUsuario)
                .orElseThrow(() -> new NoSuchElementException("El usuario aun no registra su hogar"));
        return aDTO(hogar);
    }

    @Override
    @Transactional
    public HogarDTO actualizar(Integer idHogar, HogarDTO dto) {
        Hogar hogar = hR.findById(idHogar)
                .orElseThrow(() -> new NoSuchElementException("Hogar no encontrado"));
        llenarDatos(hogar, dto);
        hR.save(hogar);
        hsR.deleteByHogar_IdHogar(idHogar);        // se reemplazan los servicios marcados
        hsR.flush();                               // primero se ejecuta el borrado en la BD
        guardarServicios(hogar, dto.getRecursos());
        actualizarSegmento(hogar.getUsuario(), dto.getEsPadre());
        return aDTO(hogar);
    }

    private void llenarDatos(Hogar hogar, HogarDTO dto) {
        Zona zona = zR.findById(dto.getIdZona())
                .orElseThrow(() -> new NoSuchElementException("Zona no encontrada"));
        hogar.setZona(zona);
        hogar.setEsPadre(dto.getEsPadre() != null && dto.getEsPadre());
        hogar.setNumPersonas(dto.getNumPersonas());
        hogar.setFechaActualizacion(LocalDate.now());
    }

    private void guardarServicios(Hogar hogar, List<Integer> recursos) {
        for (Integer idRecurso : recursos) {
            Recurso recurso = rR.findById(idRecurso)
                    .orElseThrow(() -> new NoSuchElementException("Recurso no encontrado: " + idRecurso));
            HogarServicio hs = new HogarServicio();
            hs.setHogar(hogar);
            hs.setRecurso(recurso);
            hsR.save(hs);
        }
    }

    private void actualizarSegmento(Usuario usuario, Boolean esPadre) {
        usuario.setSegmento(esPadre != null && esPadre ? "Padre de familia" : "Joven independiente");
        uR.save(usuario);
    }

    private HogarDTO aDTO(Hogar hogar) {
        HogarDTO dto = new HogarDTO();
        dto.setIdHogar(hogar.getIdHogar());
        dto.setIdUsuario(hogar.getUsuario().getIdUsuario());
        dto.setIdZona(hogar.getZona().getIdZona());
        dto.setZona(hogar.getZona().getNombre());
        dto.setEsPadre(hogar.getEsPadre());
        dto.setNumPersonas(hogar.getNumPersonas());
        List<Integer> recursos = new ArrayList<>();
        for (HogarServicio hs : hsR.findByHogar_IdHogar(hogar.getIdHogar())) {
            recursos.add(hs.getRecurso().getIdRecurso());
        }
        dto.setRecursos(recursos);
        return dto;
    }
}
