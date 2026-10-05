package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upc.ecogasto.dtos.ConsumoDTO;
import pe.edu.upc.ecogasto.dtos.SerieConsumoDTO;
import pe.edu.upc.ecogasto.entities.*;
import pe.edu.upc.ecogasto.repositories.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IConsumoService;
import pe.edu.upc.ecogasto.serviceinterfaces.INotificacionService;
import pe.edu.upc.ecogasto.serviceinterfaces.IPreferenciaService;
import pe.edu.upc.ecogasto.util.Numeros;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class    ConsumoServiceImplement implements IConsumoService {

    @Autowired
    private ConsumoRepository cR;
    @Autowired
    private HogarRepository hR;
    @Autowired
    private RecursoRepository rR;
    @Autowired
    private TarifaRepository tR;
    @Autowired
    private HogarServicioRepository hsR;
    @Autowired
    private INotificacionService notificacionService;
    @Autowired
    private IPreferenciaService preferenciaService;

    @Override
    @Transactional
    public ConsumoDTO registrar(ConsumoDTO dto) {
        Hogar hogar = hR.findById(dto.getIdHogar())
                .orElseThrow(() -> new NoSuchElementException("Hogar no encontrado"));
        Recurso recurso = rR.findById(dto.getIdRecurso())
                .orElseThrow(() -> new NoSuchElementException("Recurso no encontrado"));

        if (!hsR.existsByHogar_IdHogarAndRecurso_IdRecurso(hogar.getIdHogar(), recurso.getIdRecurso())) {
            throw new IllegalArgumentException("Tu hogar no cuenta con el servicio de " + recurso.getNombre());
        }
        if (LocalDate.of(dto.getAnio(), dto.getMes(), 1).isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("No puedes registrar un mes que aun no llega");
        }
        if (cR.existsByHogar_IdHogarAndRecurso_IdRecursoAndAnioAndMes(
                hogar.getIdHogar(), recurso.getIdRecurso(), dto.getAnio(), dto.getMes())) {
            throw new IllegalArgumentException("Ya registraste " + recurso.getNombre() + " para "
                    + dto.getMes() + "/" + dto.getAnio() + ". Puedes editar esa lectura.");
        }

        Tarifa tarifa = buscarTarifa(hogar, recurso);

        Consumo c = new Consumo();
        c.setHogar(hogar);
        c.setRecurso(recurso);
        c.setAnio(dto.getAnio());
        c.setMes(dto.getMes());
        c.setValor(dto.getValor());
        c.setCostoEstimado(calcularCosto(dto.getValor(), hogar, recurso, tarifa));
        c.setFechaRegistro(LocalDate.now());
        cR.save(c);

        boolean alerta = revisarAnomalia(c, tarifa);
        ConsumoDTO respuesta = aDTO(c);
        respuesta.setAlertaGenerada(alerta);
        return respuesta;
    }

    @Override
    public List<ConsumoDTO> listarPorHogar(Integer idHogar) {
        List<ConsumoDTO> lista = new ArrayList<>();
        for (Consumo c : cR.findByHogar_IdHogarOrderByAnioDescMesDesc(idHogar)) {
            lista.add(aDTO(c));
        }
        return lista;
    }

    @Override
    public List<ConsumoDTO> listarTodos() {
        List<ConsumoDTO> lista = new ArrayList<>();
        for (Consumo c : cR.findAll()) {
            lista.add(aDTO(c));
        }
        return lista;
    }

    @Override
    public List<SerieConsumoDTO> serieMensual(Integer idHogar, Integer idRecurso, Integer anio) {
        List<SerieConsumoDTO> lista = new ArrayList<>();
        for (Object[] fila : cR.serieMensual(idHogar, idRecurso, anio)) {
            SerieConsumoDTO dto = new SerieConsumoDTO();
            dto.setMes(Numeros.aEntero(fila[0]));
            dto.setValor(Numeros.aDouble(fila[1]));
            dto.setPromedioNacional(Numeros.aDouble(fila[2]));
            lista.add(dto);
        }
        return lista;
    }

    @Override
    public ConsumoDTO actualizar(Integer idConsumo, ConsumoDTO dto) {
        Consumo c = cR.findById(idConsumo)
                .orElseThrow(() -> new NoSuchElementException("Lectura no encontrada"));
        c.setValor(dto.getValor());
        c.setCostoEstimado(calcularCosto(dto.getValor(), c.getHogar(), c.getRecurso(),
                buscarTarifa(c.getHogar(), c.getRecurso())));
        return aDTO(cR.save(c));
    }

    @Override
    public void eliminar(Integer idConsumo) {
        if (!cR.existsById(idConsumo)) {
            throw new NoSuchElementException("Lectura no encontrada");
        }
        cR.deleteById(idConsumo);
    }

    private Tarifa buscarTarifa(Hogar hogar, Recurso recurso) {
        return tR.findByRecurso_IdRecursoAndZona_IdZona(recurso.getIdRecurso(), hogar.getZona().getIdZona())
                .orElseThrow(() -> new NoSuchElementException("No hay tarifa para " + recurso.getNombre()
                        + " en " + hogar.getZona().getNombre()));
    }

    private Double calcularCosto(Double valor, Hogar hogar, Recurso recurso, Tarifa tarifa) {
        double costo;
        if (recurso.getNombre().equals("Agua")) {
            costo = valor * hogar.getNumPersonas() * 30 * tarifa.getTarifa();
        } else {
            costo = valor * tarifa.getTarifa();
        }
        return Numeros.redondear(costo);
    }

    private boolean revisarAnomalia(Consumo c, Tarifa tarifa) {
        Double promedio = cR.promedioAnterior(c.getHogar().getIdHogar(), c.getRecurso().getIdRecurso(), c.getIdConsumo());
        if (promedio == null) {
            return false;   // es la primera lectura, no hay con que comparar
        }
        boolean superaPromedio = c.getValor() > promedio * 1.2;
        boolean superaUmbral = c.getValor() >= tarifa.getUmbralAlto();
        if (!superaPromedio || !superaUmbral) {
            return false;
        }
        Usuario usuario = c.getHogar().getUsuario();
        String recurso = c.getRecurso().getNombre();
        if (!preferenciaService.quiereAlertasDe(usuario.getIdUsuario(), recurso)) {
            return false;   // el usuario desactivo las alertas de este servicio
        }
        long exceso = Math.round((c.getValor() - promedio) * 100 / promedio);
        String mensaje = "Tu consumo de " + recurso + " de " + c.getMes() + "/" + c.getAnio() + " fue "
                + c.getValor() + " " + c.getRecurso().getUnidad() + ", " + exceso
                + "% por encima de tu promedio (" + Math.round(promedio) + "). Revisa valvulas, focos o habitos.";
        notificacionService.crear(usuario, c.getRecurso(), "Alerta de " + recurso, mensaje);
        return true;
    }

    private ConsumoDTO aDTO(Consumo c) {
        ConsumoDTO dto = new ConsumoDTO();
        dto.setIdConsumo(c.getIdConsumo());
        dto.setIdHogar(c.getHogar().getIdHogar());
        dto.setIdRecurso(c.getRecurso().getIdRecurso());
        dto.setRecurso(c.getRecurso().getNombre());
        dto.setAnio(c.getAnio());
        dto.setMes(c.getMes());
        dto.setValor(c.getValor());
        dto.setCostoEstimado(c.getCostoEstimado());
        dto.setFechaRegistro(c.getFechaRegistro());
        dto.setAlertaGenerada(false);
        return dto;
    }
}
