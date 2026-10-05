package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.AuditoriaDTO;
import pe.edu.upc.ecogasto.entities.Auditoria;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.AuditoriaRepository;
import pe.edu.upc.ecogasto.repositories.UsuarioRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IAuditoriaService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditoriaServiceImplement implements IAuditoriaService {

    @Autowired
    private AuditoriaRepository aR;
    @Autowired
    private UsuarioRepository uR;

    @Override
    public void registrar(String accion, String tabla, String detalle) {
        Usuario usuario = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            usuario = uR.findByUsername(auth.getName()).orElse(null);
        }
        registrar(usuario, accion, tabla, detalle);
    }

    @Override
    public void registrar(Usuario usuario, String accion, String tabla, String detalle) {
        Auditoria a = new Auditoria();
        a.setUsuario(usuario);
        a.setAccion(accion);
        a.setTabla(tabla);
        a.setDetalle(detalle != null && detalle.length() > 300 ? detalle.substring(0, 300) : detalle);
        a.setFecha(LocalDateTime.now());
        aR.save(a);
    }

    @Override
    public List<AuditoriaDTO> listar() {
        List<AuditoriaDTO> lista = new ArrayList<>();
        for (Auditoria a : aR.findAllByOrderByFechaDesc()) {
            AuditoriaDTO dto = new AuditoriaDTO();
            dto.setIdAuditoria(a.getIdAuditoria());
            dto.setUsuario(a.getUsuario() != null ? a.getUsuario().getUsername() : "-");
            dto.setAccion(a.getAccion());
            dto.setTabla(a.getTabla());
            dto.setDetalle(a.getDetalle());
            dto.setFecha(a.getFecha());
            lista.add(dto);
        }
        return lista;
    }
}
