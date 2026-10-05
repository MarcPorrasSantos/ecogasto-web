package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.ConsumoDTO;
import pe.edu.upc.ecogasto.dtos.MensajeDTO;
import pe.edu.upc.ecogasto.dtos.SerieConsumoDTO;
import pe.edu.upc.ecogasto.serviceinterfaces.IConsumoService;

import java.util.List;

@RestController
@RequestMapping("/api/consumos")
@Tag(name = "Consumos", description = "HU04 Registrar lectura y HU05 Grafico de consumo")
public class ConsumoController {

    @Autowired
    private IConsumoService consumoService;

    @Operation(summary = "EP08 - Registrar lectura mensual (genera alerta si es anomala)")
    @PostMapping
    public ResponseEntity<ConsumoDTO> registrar(@Valid @RequestBody ConsumoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consumoService.registrar(dto));
    }

    @Operation(summary = "EP09 - Listar las lecturas de un hogar")
    @GetMapping("/hogar/{idHogar}")
    public List<ConsumoDTO> listarPorHogar(@PathVariable Integer idHogar) {
        return consumoService.listarPorHogar(idHogar);
    }

    @Operation(summary = "EP10 - Corregir el valor de una lectura")
    @PutMapping("/{idConsumo}")
    public ConsumoDTO actualizar(@PathVariable Integer idConsumo, @Valid @RequestBody ConsumoDTO dto) {
        return consumoService.actualizar(idConsumo, dto);
    }

    @Operation(summary = "EP11 - Eliminar una lectura")
    @DeleteMapping("/{idConsumo}")
    public MensajeDTO eliminar(@PathVariable Integer idConsumo) {
        consumoService.eliminar(idConsumo);
        return new MensajeDTO("Lectura eliminada");
    }

    @Operation(summary = "EP12 - Serie mensual de un recurso vs promedio nacional (grafico)")
    @GetMapping("/hogar/{idHogar}/recurso/{idRecurso}/serie")
    public List<SerieConsumoDTO> serie(@PathVariable Integer idHogar,
                                       @PathVariable Integer idRecurso,
                                       @RequestParam Integer anio) {
        return consumoService.serieMensual(idHogar, idRecurso, anio);
    }
}
