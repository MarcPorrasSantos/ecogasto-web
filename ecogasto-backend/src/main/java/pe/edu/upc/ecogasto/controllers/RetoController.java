package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IAuditoriaService;
import pe.edu.upc.ecogasto.serviceinterfaces.IRetoService;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Retos e insignias", description = "HU12 Participar en retos y HU18 CRUD de retos")
public class RetoController {

    @Autowired
    private IRetoService retoService;
    @Autowired
    private IAuditoriaService auditoriaService;

    @Operation(summary = "EP25 - Listar retos activos")
    @GetMapping("/retos/activos")
    public List<RetoDTO> listarActivos() {
        return retoService.listarActivos();
    }

    @Operation(summary = "EP26 - Unirse a un reto")
    @PostMapping("/retos-usuario")
    public ResponseEntity<RetoUsuarioDTO> unirse(@Valid @RequestBody RetoUsuarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(retoService.unirse(dto));
    }

    @Operation(summary = "EP27 - Listar mis retos")
    @GetMapping("/retos-usuario/usuario/{idUsuario}")
    public List<RetoUsuarioDTO> misRetos(@PathVariable Integer idUsuario) {
        return retoService.listarPorUsuario(idUsuario);
    }

    @Operation(summary = "EP28 - Marcar reto como completado (se valida la meta)")
    @PutMapping("/retos-usuario/{idRetoUsuario}/completar")
    public CompletarRetoDTO completar(@PathVariable Integer idRetoUsuario) {
        return retoService.completar(idRetoUsuario);
    }

    @Operation(summary = "EP29 - Listar mis insignias")
    @GetMapping("/insignias/usuario/{idUsuario}")
    public List<InsigniaDTO> misInsignias(@PathVariable Integer idUsuario) {
        return retoService.insigniasPorUsuario(idUsuario);
    }

    @Operation(summary = "EP60 - Listar todos los retos")
    @GetMapping("/retos")
    public List<RetoDTO> listar() {
        return retoService.listar();
    }

    @Operation(summary = "EP61 - Crear reto")
    @PostMapping("/retos")
    public ResponseEntity<RetoDTO> insertar(@Valid @RequestBody RetoDTO dto) {
        RetoDTO creado = retoService.insertar(dto);
        auditoriaService.registrar("CREAR", "retos", creado.getTitulo());
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @Operation(summary = "EP62 - Editar reto")
    @PutMapping("/retos/{id}")
    public RetoDTO actualizar(@PathVariable Integer id, @Valid @RequestBody RetoDTO dto) {
        RetoDTO editado = retoService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "retos", editado.getTitulo());
        return editado;
    }

    @Operation(summary = "EP63 - Eliminar reto")
    @DeleteMapping("/retos/{id}")
    public MensajeDTO eliminar(@PathVariable Integer id) {
        retoService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "retos", "Reto id " + id);
        return new MensajeDTO("Reto eliminado");
    }
}
