package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.PreferenciaDTO;
import pe.edu.upc.ecogasto.entities.PreferenciaNotificacion;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.PreferenciaNotificacionRepository;
import pe.edu.upc.ecogasto.repositories.UsuarioRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IPreferenciaService;

import java.util.NoSuchElementException;

@Service
public class PreferenciaServiceImplement implements IPreferenciaService {

    @Autowired
    private PreferenciaNotificacionRepository pR;
    @Autowired
    private UsuarioRepository uR;

    @Override
    public PreferenciaDTO obtener(Integer idUsuario) {
        return aDTO(buscarOCrear(idUsuario));
    }

    @Override
    public PreferenciaDTO actualizar(Integer idUsuario, PreferenciaDTO dto) {
        PreferenciaNotificacion p = buscarOCrear(idUsuario);
        p.setNotifAgua(dto.getNotifAgua());
        p.setNotifLuz(dto.getNotifLuz());
        p.setNotifGas(dto.getNotifGas());
        p.setNotifTransporte(dto.getNotifTransporte());
        p.setAceptaRetos(dto.getAceptaRetos());
        p.setRecordatorioSemanal(dto.getRecordatorioSemanal());
        return aDTO(pR.save(p));
    }

    @Override
    public boolean quiereAlertasDe(Integer idUsuario, String recurso) {
        PreferenciaNotificacion p = buscarOCrear(idUsuario);
        if (recurso.equals("Agua")) {
            return p.getNotifAgua();
        } else if (recurso.equals("Luz")) {
            return p.getNotifLuz();
        } else if (recurso.equals("Gas")) {
            return p.getNotifGas();
        } else {
            return p.getNotifTransporte();
        }
    }

    private PreferenciaNotificacion buscarOCrear(Integer idUsuario) {
        return pR.findByUsuario_IdUsuario(idUsuario).orElseGet(() -> {
            Usuario u = uR.findById(idUsuario)
                    .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
            PreferenciaNotificacion nueva = new PreferenciaNotificacion();
            nueva.setUsuario(u);
            nueva.setNotifAgua(true);
            nueva.setNotifLuz(true);
            nueva.setNotifGas(true);
            nueva.setNotifTransporte(true);
            nueva.setAceptaRetos(true);
            nueva.setRecordatorioSemanal(false);
            return pR.save(nueva);
        });
    }

    private PreferenciaDTO aDTO(PreferenciaNotificacion p) {
        PreferenciaDTO dto = new PreferenciaDTO();
        dto.setNotifAgua(p.getNotifAgua());
        dto.setNotifLuz(p.getNotifLuz());
        dto.setNotifGas(p.getNotifGas());
        dto.setNotifTransporte(p.getNotifTransporte());
        dto.setAceptaRetos(p.getAceptaRetos());
        dto.setRecordatorioSemanal(p.getRecordatorioSemanal());
        return dto;
    }
}
