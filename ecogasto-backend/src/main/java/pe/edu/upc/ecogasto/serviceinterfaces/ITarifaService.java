package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.TarifaDTO;

import java.util.List;

public interface ITarifaService {

    List<TarifaDTO> listar();

    TarifaDTO insertar(TarifaDTO dto);

    TarifaDTO actualizar(Integer idTarifa, TarifaDTO dto);

    void eliminar(Integer idTarifa);
}
