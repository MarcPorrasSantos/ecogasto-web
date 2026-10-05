package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.*;

import java.util.List;

public interface IReporteService {

    List<ImpactoDTO> impactoAmbiental(Integer idHogar, Integer anio, Integer mes);         // HU06

    List<ComparacionDTO> comparacionNacional(Integer idHogar, Integer anio, Integer mes);  // HU06

    List<ComparacionDTO> hogaresSimilares(Integer idHogar, Integer anio, Integer mes);     // HU10

    List<PromedioZonaDTO> promedioMensualZona(Integer idZona, Integer anio);               // HU11

    List<RankingDTO> ranking(String zona, String segmento);                                // HU13

    ResumenLogrosDTO resumenLogros(Integer idUsuario);                                     // HU14

    IndicadoresDTO indicadores();                                                          // HU15

    List<NivelConsumoDTO> nivelConsumo();                                                  // HU15

    List<CarenciaDTO> carenciasPorZona();                                                  // HU15

    List<PromedioZonaDTO> promedioMensualTodas(Integer anio);                              // HU15
}
