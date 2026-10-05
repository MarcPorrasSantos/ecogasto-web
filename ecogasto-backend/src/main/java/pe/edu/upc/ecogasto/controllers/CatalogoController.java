package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.*;
import pe.edu.upc.ecogasto.serviceinterfaces.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Catalogos", description = "Recursos, zonas, tarifas/umbrales y eco tips")
public class CatalogoController {

    @Autowired
    private IRecursoService recursoService;
    @Autowired
    private IZonaService zonaService;
    @Autowired
    private ITarifaService tarifaService;
    @Autowired
    private IEcoTipService ecoTipService;
    @Autowired
    private IAuditoriaService auditoriaService;

    @Operation(summary = "EP04 - Listar recursos (Agua, Luz, Gas, Transporte)")
    @GetMapping("/recursos")
    public List<RecursoDTO> listarRecursos() {
        return recursoService.listar();
    }

    @Operation(summary = "EP03 - Listar zonas activas")
    @GetMapping("/zonas")
    public List<ZonaDTO> listarZonasActivas() {
        return zonaService.listarActivas();
    }

    @Operation(summary = "EP52 - Listar todas las zonas (admin)")
    @GetMapping("/zonas/todas")
    public List<ZonaDTO> listarZonas() {
        return zonaService.listar();
    }

    @Operation(summary = "EP53 - Crear zona")
    @PostMapping("/zonas")
    public ResponseEntity<ZonaDTO> insertarZona(@Valid @RequestBody ZonaDTO dto) {
        ZonaDTO creada = zonaService.insertar(dto);
        auditoriaService.registrar("CREAR", "zonas", "Zona " + creada.getNombre());
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @Operation(summary = "EP54 - Editar zona")
    @PutMapping("/zonas/{id}")
    public ZonaDTO actualizarZona(@PathVariable Integer id, @Valid @RequestBody ZonaDTO dto) {
        ZonaDTO editada = zonaService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "zonas", "Zona " + editada.getNombre());
        return editada;
    }

    @Operation(summary = "EP55 - Eliminar zona")
    @DeleteMapping("/zonas/{id}")
    public MensajeDTO eliminarZona(@PathVariable Integer id) {
        zonaService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "zonas", "Zona id " + id);
        return new MensajeDTO("Zona eliminada");
    }

    @Operation(summary = "EP48 - Listar tarifas y umbrales")
    @GetMapping("/tarifas")
    public List<TarifaDTO> listarTarifas() {
        return tarifaService.listar();
    }

    @Operation(summary = "EP49 - Crear tarifa")
    @PostMapping("/tarifas")
    public ResponseEntity<TarifaDTO> insertarTarifa(@Valid @RequestBody TarifaDTO dto) {
        TarifaDTO creada = tarifaService.insertar(dto);
        auditoriaService.registrar("CREAR", "tarifas", creada.getRecurso() + "/" + creada.getZona());
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @Operation(summary = "EP50 - Editar tarifa y umbrales")
    @PutMapping("/tarifas/{id}")
    public TarifaDTO actualizarTarifa(@PathVariable Integer id, @Valid @RequestBody TarifaDTO dto) {
        TarifaDTO editada = tarifaService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "tarifas", editada.getRecurso() + "/" + editada.getZona()
                + ": bajo " + editada.getUmbralBajo() + ", alto " + editada.getUmbralAlto());
        return editada;
    }

    @Operation(summary = "EP51 - Eliminar tarifa")
    @DeleteMapping("/tarifas/{id}")
    public MensajeDTO eliminarTarifa(@PathVariable Integer id) {
        tarifaService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "tarifas", "Tarifa id " + id);
        return new MensajeDTO("Tarifa eliminada");
    }

    @Operation(summary = "EP17 - Listar eco tips activos de un recurso")
    @GetMapping("/ecotips/recurso/{idRecurso}")
    public List<EcoTipDTO> listarTipsPorRecurso(@PathVariable Integer idRecurso) {
        return ecoTipService.listarPorRecurso(idRecurso);
    }

    @Operation(summary = "EP56 - Listar eco tips")
    @GetMapping("/ecotips")
    public List<EcoTipDTO> listarTips() {
        return ecoTipService.listar();
    }

    @Operation(summary = "EP57 - Crear eco tip")
    @PostMapping("/ecotips")
    public ResponseEntity<EcoTipDTO> insertarTip(@Valid @RequestBody EcoTipDTO dto) {
        EcoTipDTO creado = ecoTipService.insertar(dto);
        auditoriaService.registrar("CREAR", "eco_tips", "Tip de " + creado.getRecurso());
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @Operation(summary = "EP58 - Editar eco tip")
    @PutMapping("/ecotips/{id}")
    public EcoTipDTO actualizarTip(@PathVariable Integer id, @Valid @RequestBody EcoTipDTO dto) {
        EcoTipDTO editado = ecoTipService.actualizar(id, dto);
        auditoriaService.registrar("EDITAR", "eco_tips", "Tip id " + id);
        return editado;
    }

    @Operation(summary = "EP59 - Eliminar eco tip")
    @DeleteMapping("/ecotips/{id}")
    public MensajeDTO eliminarTip(@PathVariable Integer id) {
        ecoTipService.eliminar(id);
        auditoriaService.registrar("ELIMINAR", "eco_tips", "Tip id " + id);
        return new MensajeDTO("Tip eliminado");
    }
}
