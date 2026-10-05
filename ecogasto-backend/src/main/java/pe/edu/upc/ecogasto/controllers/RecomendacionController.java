package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.RecomendacionDTO;
import pe.edu.upc.ecogasto.dtos.ValoracionDTO;
import pe.edu.upc.ecogasto.serviceinterfaces.IRecomendacionService;

@RestController
@RequestMapping("/api/recomendaciones")
@Tag(name = "Eco Tips con IA", description = "HU07 Eco Tip personalizado")
public class RecomendacionController {

    @Autowired
    private IRecomendacionService recomendacionService;

    @Operation(summary = "EP15 - Generar Eco Tip personalizado (consulta la API de IA)")
    @GetMapping("/personalizada/usuario/{idUsuario}")
    public RecomendacionDTO personalizada(@PathVariable Integer idUsuario) {
        return recomendacionService.generarPersonalizada(idUsuario);
    }

    @Operation(summary = "EP16 - Valorar el Eco Tip (me sirvio / no me ayudo)")
    @PutMapping("/{idRecomendacion}/valoracion")
    public RecomendacionDTO valorar(@PathVariable Integer idRecomendacion, @Valid @RequestBody ValoracionDTO dto) {
        return recomendacionService.valorar(idRecomendacion, dto.getUtil());
    }
}
