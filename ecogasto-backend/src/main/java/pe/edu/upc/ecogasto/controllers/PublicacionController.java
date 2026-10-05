package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.MensajeDTO;
import pe.edu.upc.ecogasto.dtos.PublicacionDTO;
import pe.edu.upc.ecogasto.serviceinterfaces.IPublicacionService;

import java.util.List;

@RestController
@RequestMapping("/api/publicaciones")
@Tag(name = "Comunidad", description = "HU14 Publicaciones de la comunidad")
public class PublicacionController {

    @Autowired
    private IPublicacionService publicacionService;

    @Operation(summary = "EP31 - Listar publicaciones (mas recientes primero)")
    @GetMapping
    public List<PublicacionDTO> listar() {
        return publicacionService.listar();
    }

    @Operation(summary = "EP32 - Publicar en la comunidad")
    @PostMapping
    public ResponseEntity<PublicacionDTO> insertar(@Valid @RequestBody PublicacionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(publicacionService.insertar(dto));
    }

    @Operation(summary = "EP33 - Eliminar una publicacion")
    @DeleteMapping("/{idPublicacion}")
    public MensajeDTO eliminar(@PathVariable Integer idPublicacion) {
        publicacionService.eliminar(idPublicacion);
        return new MensajeDTO("Publicacion eliminada");
    }
}
