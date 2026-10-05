package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upc.ecogasto.dtos.CompletarRetoDTO;
import pe.edu.upc.ecogasto.dtos.InsigniaDTO;
import pe.edu.upc.ecogasto.dtos.RetoDTO;
import pe.edu.upc.ecogasto.dtos.RetoUsuarioDTO;
import pe.edu.upc.ecogasto.entities.*;
import pe.edu.upc.ecogasto.repositories.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IRetoService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RetoServiceImplement implements IRetoService {

    @Autowired
    private RetoRepository reR;
    @Autowired
    private RetoUsuarioRepository ruR;
    @Autowired
    private InsigniaRepository iR;
    @Autowired
    private InsigniaUsuarioRepository iuR;
    @Autowired
    private UsuarioRepository uR;
    @Autowired
    private RecursoRepository rR;
    @Autowired
    private ConsumoRepository cR;

    @Override
    public List<RetoDTO> listar() {
        return aLista(reR.findAll());
    }

    @Override
    public List<RetoDTO> listarActivos() {
        return aLista(reR.findByActivoTrue());
    }

    @Override
    public RetoDTO insertar(RetoDTO dto) {
        Reto r = new Reto();
        llenar(r, dto);
        return aDTO(reR.save(r));
    }

    @Override
    public RetoDTO actualizar(Integer idReto, RetoDTO dto) {
        Reto r = reR.findById(idReto).orElseThrow(() -> new NoSuchElementException("Reto no encontrado"));
        llenar(r, dto);
        return aDTO(reR.save(r));
    }

    @Override
    public void eliminar(Integer idReto) {
        if (!reR.existsById(idReto)) {
            throw new NoSuchElementException("Reto no encontrado");
        }
        reR.deleteById(idReto);
    }

    @Override
    public RetoUsuarioDTO unirse(RetoUsuarioDTO dto) {
        Usuario u = uR.findById(dto.getIdUsuario())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        Reto reto = reR.findById(dto.getIdReto())
                .orElseThrow(() -> new NoSuchElementException("Reto no encontrado"));
        if (!reto.getActivo()) {
            throw new IllegalArgumentException("El reto ya no esta disponible");
        }
        if (ruR.existsByUsuario_IdUsuarioAndReto_IdReto(u.getIdUsuario(), reto.getIdReto())) {
            throw new IllegalArgumentException("Ya participas en este reto");
        }
        RetoUsuario ru = new RetoUsuario();
        ru.setUsuario(u);
        ru.setReto(reto);
        ru.setEstado("EN_CURSO");
        ru.setFechaInicio(LocalDate.now());
        return aDTO(ruR.save(ru));
    }

    @Override
    public List<RetoUsuarioDTO> listarPorUsuario(Integer idUsuario) {
        List<RetoUsuarioDTO> lista = new ArrayList<>();
        for (RetoUsuario ru : ruR.findByUsuario_IdUsuario(idUsuario)) {
            lista.add(aDTO(ru));
        }
        return lista;
    }


    @Override
    @Transactional
    public CompletarRetoDTO completar(Integer idRetoUsuario) {
        RetoUsuario ru = ruR.findById(idRetoUsuario)
                .orElseThrow(() -> new NoSuchElementException("Participacion no encontrada"));
        if (ru.getEstado().equals("COMPLETADO")) {
            throw new IllegalArgumentException("Este reto ya fue completado");
        }
        Integer idUsuario = ru.getUsuario().getIdUsuario();
        Reto reto = ru.getReto();

        List<Number> lecturas = cR.ultimasLecturas(idUsuario, reto.getRecurso().getIdRecurso());
        if (lecturas.size() < 2) {
            throw new IllegalArgumentException("Necesitas al menos dos lecturas de "
                    + reto.getRecurso().getNombre() + " para validar el reto");
        }
        double actual = lecturas.get(0).doubleValue();
        double anterior = lecturas.get(1).doubleValue();
        double reduccion = (anterior - actual) * 100 / anterior;
        if (reduccion < reto.getMetaPorcentaje()) {
            throw new IllegalArgumentException(String.format(
                    "Aun no alcanzas la meta: redujiste %.1f%% y el reto pide %d%%",
                    reduccion, reto.getMetaPorcentaje()));
        }

        ru.setEstado("COMPLETADO");
        ru.setFechaCompletado(LocalDate.now());
        ruR.save(ru);


        Integer puntos = ruR.puntosTotales(idUsuario);
        List<String> nuevas = new ArrayList<>();
        for (Insignia i : iR.insigniasPendientes(idUsuario, puntos)) {
            InsigniaUsuario iu = new InsigniaUsuario();
            iu.setUsuario(ru.getUsuario());
            iu.setInsignia(i);
            iu.setFechaObtencion(LocalDate.now());
            iuR.save(iu);
            nuevas.add(i.getNombre());
        }

        CompletarRetoDTO dto = new CompletarRetoDTO();
        dto.setMensaje("Reto completado! Ganaste " + reto.getPuntos() + " puntos");
        dto.setPuntosTotales(puntos);
        dto.setInsigniasNuevas(nuevas);
        return dto;
    }

    @Override
    public List<InsigniaDTO> insigniasPorUsuario(Integer idUsuario) {
        List<InsigniaDTO> lista = new ArrayList<>();
        for (InsigniaUsuario iu : iuR.findByUsuario_IdUsuarioOrderByFechaObtencionDesc(idUsuario)) {
            InsigniaDTO dto = new InsigniaDTO();
            dto.setIdInsignia(iu.getInsignia().getIdInsignia());
            dto.setNombre(iu.getInsignia().getNombre());
            dto.setPuntosRequeridos(iu.getInsignia().getPuntosRequeridos());
            dto.setImagenUrl(iu.getInsignia().getImagenUrl());
            dto.setFechaObtencion(iu.getFechaObtencion());
            lista.add(dto);
        }
        return lista;
    }

    private void llenar(Reto r, RetoDTO dto) {
        r.setTitulo(dto.getTitulo());
        r.setDescripcion(dto.getDescripcion());
        r.setRecurso(rR.findById(dto.getIdRecurso()).orElseThrow(() -> new NoSuchElementException("Recurso no encontrado")));
        r.setMetaPorcentaje(dto.getMetaPorcentaje());
        r.setPuntos(dto.getPuntos());
        r.setActivo(dto.getActivo() == null || dto.getActivo());
    }

    private List<RetoDTO> aLista(List<Reto> retos) {
        List<RetoDTO> lista = new ArrayList<>();
        for (Reto r : retos) {
            lista.add(aDTO(r));
        }
        return lista;
    }

    private RetoDTO aDTO(Reto r) {
        RetoDTO dto = new RetoDTO();
        dto.setIdReto(r.getIdReto());
        dto.setTitulo(r.getTitulo());
        dto.setDescripcion(r.getDescripcion());
        dto.setIdRecurso(r.getRecurso().getIdRecurso());
        dto.setRecurso(r.getRecurso().getNombre());
        dto.setMetaPorcentaje(r.getMetaPorcentaje());
        dto.setPuntos(r.getPuntos());
        dto.setActivo(r.getActivo());
        return dto;
    }

    private RetoUsuarioDTO aDTO(RetoUsuario ru) {
        RetoUsuarioDTO dto = new RetoUsuarioDTO();
        dto.setIdRetoUsuario(ru.getIdRetoUsuario());
        dto.setIdUsuario(ru.getUsuario().getIdUsuario());
        dto.setIdReto(ru.getReto().getIdReto());
        dto.setReto(ru.getReto().getTitulo());
        dto.setEstado(ru.getEstado());
        dto.setFechaInicio(ru.getFechaInicio());
        dto.setFechaCompletado(ru.getFechaCompletado());
        return dto;
    }
}
