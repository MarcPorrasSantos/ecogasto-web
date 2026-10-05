package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.ConsumoDTO;
import pe.edu.upc.ecogasto.dtos.SerieConsumoDTO;

import java.util.List;

public interface IConsumoService {

    ConsumoDTO registrar(ConsumoDTO dto);                                   // HU04 (+ alerta HU08)

    List<ConsumoDTO> listarPorHogar(Integer idHogar);                       // HU04

    List<ConsumoDTO> listarTodos();                                         // HU16

    List<SerieConsumoDTO> serieMensual(Integer idHogar, Integer idRecurso, Integer anio); // HU05

    ConsumoDTO actualizar(Integer idConsumo, ConsumoDTO dto);               // HU04, HU16

    void eliminar(Integer idConsumo);                                       // HU04, HU16
}
