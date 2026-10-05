package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.EcoTipDTO;

import java.util.List;

public interface IEcoTipService {

    List<EcoTipDTO> listar();

    List<EcoTipDTO> listarPorRecurso(Integer idRecurso);

    EcoTipDTO insertar(EcoTipDTO dto);

    EcoTipDTO actualizar(Integer idTip, EcoTipDTO dto);

    void eliminar(Integer idTip);
}
