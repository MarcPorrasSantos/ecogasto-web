package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.HogarDTO;
import pe.edu.upc.ecogasto.serviceinterfaces.IHogarService;

@RestController
@RequestMapping("/api/hogares")
@Tag(name = "Hogares", description = "HU03 Datos del hogar")
public class HogarController {

    @Autowired
    private IHogarService hogarService;

    @Operation(summary = "EP05 - Registrar los datos del hogar")
    @PostMapping
    public ResponseEntity<HogarDTO> registrar(@Valid @RequestBody HogarDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hogarService.registrar(dto));
    }

    @Operation(summary = "EP06 - Obtener el hogar de un usuario")
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<HogarDTO> buscarPorUsuario(@PathVariable Integer idUsuario) {
        return ResponseEntity.ok(hogarService.buscarPorUsuario(idUsuario));
    }

    @Operation(summary = "EP07 - Actualizar los datos del hogar")
    @PutMapping("/{idHogar}")
    public ResponseEntity<HogarDTO> actualizar(@PathVariable Integer idHogar, @Valid @RequestBody HogarDTO dto) {
        return ResponseEntity.ok(hogarService.actualizar(idHogar, dto));
    }
}
