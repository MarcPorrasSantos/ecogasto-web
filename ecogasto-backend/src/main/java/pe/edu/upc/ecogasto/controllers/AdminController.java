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
import pe.edu.upc.ecogasto.serviceinterfaces.IConsumoService;
import pe.edu.upc.ecogasto.serviceinterfaces.IReporteService;
import pe.edu.upc.ecogasto.serviceinterfaces.IUsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Panel de administracion", description = "HU15 Resumen y auditoria, HU16 Usuarios y consumos")
public class AdminController {

    @Autowired
    private IReporteService reporteService;
    @Autowired
    private IUsuarioService usuarioService;
    @Autowired
    private IConsumoService consumoService;
    @Autowired
    private IAuditoriaService auditoriaService;

    @Operation(summary = "EP35 - Indicadores generales")
    @GetMapping("/reportes/indicadores")
    public IndicadoresDTO indicadores() {
        return reporteService.indicadores();
    }

    @Operation(summary = "EP36 - Nivel de consumo de todos los usuarios")
    @GetMapping("/reportes/nivel-consumo")
    public List<NivelConsumoDTO> nivelConsumo() {
        return reporteService.nivelConsumo();
    }

    @Operation(summary = "EP37 - Carencias por zona")
    @GetMapping("/reportes/carencias-zona")
    public List<CarenciaDTO> carencias() {
        return reporteService.carenciasPorZona();
    }

    @Operation(summary = "EP38 - Consumo promedio mensual por zona")
    @GetMapping("/reportes/promedio-mensual")
    public List<PromedioZonaDTO> promedioMensual(@RequestParam Integer anio) {
        return reporteService.promedioMensualTodas(anio);
    }

    @Operation(summary = "EP39 - Auditoria (solo lectura)")
    @GetMapping("/auditoria")
    public List<AuditoriaDTO> auditoria() {
        return auditoriaService.listar();
    }

    @Operation(summary = "EP40 - Listar usuarios")
    @GetMapping("/usuarios")
    public List<UsuarioDTO> listarUsuarios() {
        return usuarioService.listar();
    }

    @Operation(summary = "EP41 - Crear usuario")
    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioDTO> insertarUsuario(@Valid @RequestBody UsuarioDTO dto) {
        UsuarioDTO creado = usuarioService.insertar(dto);
        auditoriaService.registrar("CREAR", "usuarios", "Usuario " + creado.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @Operation(summary = "EP42 - Editar usuario (incluye bloquear / desbloquear)")
    @PutMapping("/usuarios/{id}")
    public UsuarioDTO actualizarUsuario(@PathVariable Integer id, @Valid @RequestBody UsuarioDTO dto) {
        UsuarioDTO editado = usuarioService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "usuarios", "Usuario " + editado.getUsername()
                + (editado.getActivo() ? " (activo)" : " (bloqueado)"));
        return editado;
    }

    @Operation(summary = "EP43 - Eliminar usuario (borra en cascada su hogar y consumos)")
    @DeleteMapping("/usuarios/{id}")
    public MensajeDTO eliminarUsuario(@PathVariable Integer id) {
        usuarioService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "usuarios", "Usuario id " + id);
        return new MensajeDTO("Usuario eliminado");
    }

    @Operation(summary = "EP44 - Listar todos los registros de consumo")
    @GetMapping("/consumos")
    public List<ConsumoDTO> listarConsumos() {
        return consumoService.listarTodos();
    }

    @Operation(summary = "EP45 - Registrar consumo para un hogar")
    @PostMapping("/consumos")
    public ResponseEntity<ConsumoDTO> insertarConsumo(@Valid @RequestBody ConsumoDTO dto) {
        ConsumoDTO creado = consumoService.registrar(dto);
        auditoriaService.registrar("CREAR", "consumos", "Hogar " + creado.getIdHogar() + " - "
                + creado.getRecurso() + " " + creado.getMes() + "/" + creado.getAnio());
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @Operation(summary = "EP46 - Editar registro de consumo")
    @PutMapping("/consumos/{id}")
    public ConsumoDTO actualizarConsumo(@PathVariable Integer id, @Valid @RequestBody ConsumoDTO dto) {
        ConsumoDTO editado = consumoService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "consumos", "Consumo id " + id + " -> " + editado.getValor());
        return editado;
    }

    @Operation(summary = "EP47 - Eliminar registro de consumo")
    @DeleteMapping("/consumos/{id}")
    public MensajeDTO eliminarConsumo(@PathVariable Integer id) {
        consumoService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "consumos", "Consumo id " + id);
        return new MensajeDTO("Registro eliminado");
    }
}
