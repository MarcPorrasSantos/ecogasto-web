package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upc.ecogasto.dtos.RegistroDTO;
import pe.edu.upc.ecogasto.dtos.UsuarioDTO;
import pe.edu.upc.ecogasto.entities.PreferenciaNotificacion;
import pe.edu.upc.ecogasto.entities.Rol;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.HogarRepository;
import pe.edu.upc.ecogasto.repositories.PreferenciaNotificacionRepository;
import pe.edu.upc.ecogasto.repositories.RolRepository;
import pe.edu.upc.ecogasto.repositories.UsuarioRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IUsuarioService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class UsuarioServiceImplement implements IUsuarioService {

    @Autowired
    private UsuarioRepository uR;
    @Autowired
    private RolRepository rolR;
    @Autowired
    private HogarRepository hR;
    @Autowired
    private PreferenciaNotificacionRepository pR;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UsuarioDTO registrar(RegistroDTO dto) {
        if (!dto.getPassword().equals(dto.getConfirmarPassword())) {
            throw new IllegalArgumentException("Las contrasenas no coinciden");
        }
        if (uR.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Ese usuario ya existe");
        }
        if (uR.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Ese email ya esta registrado");
        }
        Usuario u = new Usuario();
        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setPassword(passwordEncoder.encode(dto.getPassword()));
        u.setNombreCompleto(dto.getUsername());
        u.setSegmento("Joven independiente");
        u.setActivo(true);
        u.setIntentosFallidos(0);
        u.setFechaRegistro(LocalDate.now());
        u.setRol(buscarRol("USER"));
        uR.save(u);

        PreferenciaNotificacion p = new PreferenciaNotificacion();
        p.setUsuario(u);
        p.setNotifAgua(true);
        p.setNotifLuz(true);
        p.setNotifGas(true);
        p.setNotifTransporte(true);
        p.setAceptaRetos(true);
        p.setRecordatorioSemanal(false);
        pR.save(p);

        return aDTO(u);
    }

    @Override
    public List<UsuarioDTO> listar() {
        List<UsuarioDTO> lista = new ArrayList<>();
        for (Usuario u : uR.findAll()) {
            lista.add(aDTO(u));
        }
        return lista;
    }

    @Override
    public UsuarioDTO insertar(UsuarioDTO dto) {
        if (dto.getPassword() == null || dto.getPassword().length() < 8) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 8 caracteres");
        }
        if (uR.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Ese usuario ya existe");
        }
        if (uR.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Ese email ya esta registrado");
        }
        Usuario u = new Usuario();
        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setPassword(passwordEncoder.encode(dto.getPassword()));
        u.setNombreCompleto(dto.getNombreCompleto());
        u.setSegmento(dto.getSegmento() != null ? dto.getSegmento() : "Joven independiente");
        u.setActivo(true);
        u.setIntentosFallidos(0);
        u.setFechaRegistro(LocalDate.now());
        u.setRol(buscarRol(dto.getRol() != null ? dto.getRol() : "USER"));
        return aDTO(uR.save(u));
    }

    @Override
    public UsuarioDTO actualizar(Integer idUsuario, UsuarioDTO dto) {
        Usuario u = uR.findById(idUsuario)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        u.setEmail(dto.getEmail());
        u.setNombreCompleto(dto.getNombreCompleto());
        if (dto.getSegmento() != null) {
            u.setSegmento(dto.getSegmento());
        }
        if (dto.getRol() != null) {
            u.setRol(buscarRol(dto.getRol()));
        }
        if (dto.getActivo() != null) {
            u.setActivo(dto.getActivo());
            if (dto.getActivo()) {
                u.setIntentosFallidos(0);     // al reactivar se reinician los intentos
            }
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            u.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return aDTO(uR.save(u));
    }

    @Override
    public void eliminar(Integer idUsuario) {
        if (!uR.existsById(idUsuario)) {
            throw new NoSuchElementException("Usuario no encontrado");
        }
        uR.deleteById(idUsuario);
    }

    @Override
    public UsuarioDTO buscarPorUsername(String username) {
        Usuario u = uR.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        return aDTO(u);
    }

    private Rol buscarRol(String nombre) {
        return rolR.findByNombre(nombre)
                .orElseThrow(() -> new IllegalArgumentException("Rol no valido: " + nombre));
    }

    private UsuarioDTO aDTO(Usuario u) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setIdUsuario(u.getIdUsuario());
        dto.setUsername(u.getUsername());
        dto.setEmail(u.getEmail());
        dto.setNombreCompleto(u.getNombreCompleto());
        dto.setSegmento(u.getSegmento());
        dto.setActivo(u.getActivo());
        dto.setRol(u.getRol().getNombre());
        dto.setFechaRegistro(u.getFechaRegistro());
        dto.setTieneHogar(u.getIdUsuario() != null && hR.existsByUsuario_IdUsuario(u.getIdUsuario()));
        return dto;
    }
}
