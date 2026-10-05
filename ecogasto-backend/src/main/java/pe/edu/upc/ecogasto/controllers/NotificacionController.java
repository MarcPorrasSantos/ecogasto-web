package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.MensajeDTO;
import pe.edu.upc.ecogasto.dtos.NotificacionDTO;
import pe.edu.upc.ecogasto.dtos.PreferenciaDTO;
import pe.edu.upc.ecogasto.serviceinterfaces.INotificacionService;
import pe.edu.upc.ecogasto.serviceinterfaces.IPreferenciaService;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Notificaciones", description = "HU08 Alertas y HU09 Preferencias")
public class NotificacionController {

    @Autowired
    private INotificacionService notificacionService;
    @Autowired
    private IPreferenciaService preferenciaService;

    @Operation(summary = "EP18 - Listar notificaciones del usuario")
    @GetMapping("/notificaciones/usuario/{idUsuario}")
    public List<NotificacionDTO> listar(@PathVariable Integer idUsuario) {
        return notificacionService.listarPorUsuario(idUsuario);
    }

    @Operation(summary = "EP19 - Marcar todas como leidas")
    @PutMapping("/notificaciones/usuario/{idUsuario}/leidas")
    public MensajeDTO marcarLeidas(@PathVariable Integer idUsuario) {
        notificacionService.marcarTodasLeidas(idUsuario);
        return new MensajeDTO("Notificaciones marcadas como leidas");
    }

    @Operation(summary = "EP20 - Eliminar todas las notificaciones")
    @DeleteMapping("/notificaciones/usuario/{idUsuario}")
    public MensajeDTO eliminarTodas(@PathVariable Integer idUsuario) {
        notificacionService.eliminarTodas(idUsuario);
        return new MensajeDTO("Notificaciones eliminadas");
    }

    @Operation(summary = "EP21 - Obtener preferencias de notificacion")
    @GetMapping("/preferencias/usuario/{idUsuario}")
    public PreferenciaDTO obtenerPreferencias(@PathVariable Integer idUsuario) {
        return preferenciaService.obtener(idUsuario);
    }

    @Operation(summary = "EP22 - Guardar preferencias de notificacion")
    @PutMapping("/preferencias/usuario/{idUsuario}")
    public PreferenciaDTO guardarPreferencias(@PathVariable Integer idUsuario, @Valid @RequestBody PreferenciaDTO dto) {
        return preferenciaService.actualizar(idUsuario, dto);
    }
}
