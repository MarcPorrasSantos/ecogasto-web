package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IReporteService;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@Tag(name = "Reportes del usuario", description = "HU06, HU10, HU11, HU13, HU14")
public class ReporteController {

    @Autowired
    private IReporteService reporteService;

    @Operation(summary = "EP13 - Impacto ambiental del mes (CO2 y litros)")
    @GetMapping("/impacto/hogar/{idHogar}")
    public List<ImpactoDTO> impacto(@PathVariable Integer idHogar, @RequestParam Integer anio, @RequestParam Integer mes) {
        return reporteService.impactoAmbiental(idHogar, anio, mes);
    }

    @Operation(summary = "EP14 - Comparar con el promedio nacional")
    @GetMapping("/comparacion-nacional/hogar/{idHogar}")
    public List<ComparacionDTO> comparacionNacional(@PathVariable Integer idHogar, @RequestParam Integer anio, @RequestParam Integer mes) {
        return reporteService.comparacionNacional(idHogar, anio, mes);
    }

    @Operation(summary = "EP23 - Comparar con hogares similares (misma zona, +/- 1 persona)")
    @GetMapping("/hogares-similares/hogar/{idHogar}")
    public List<ComparacionDTO> hogaresSimilares(@PathVariable Integer idHogar, @RequestParam Integer anio, @RequestParam Integer mes) {
        return reporteService.hogaresSimilares(idHogar, anio, mes);
    }

    @Operation(summary = "EP24 - Estadisticas locales: promedio mensual de una zona")
    @GetMapping("/zona/{idZona}/promedio-mensual")
    public List<PromedioZonaDTO> promedioZona(@PathVariable Integer idZona, @RequestParam Integer anio) {
        return reporteService.promedioMensualZona(idZona, anio);
    }

    @Operation(summary = "EP30 - Ranking sostenible (filtro opcional por zona o segmento)")
    @GetMapping("/ranking")
    public List<RankingDTO> ranking(@RequestParam(defaultValue = "") String zona,
                                    @RequestParam(defaultValue = "") String segmento) {
        return reporteService.ranking(zona, segmento);
    }

    @Operation(summary = "EP34 - Resumen de logros para compartir")
    @GetMapping("/resumen-logros/usuario/{idUsuario}")
    public ResumenLogrosDTO resumenLogros(@PathVariable Integer idUsuario) {
        return reporteService.resumenLogros(idUsuario);
    }
}
