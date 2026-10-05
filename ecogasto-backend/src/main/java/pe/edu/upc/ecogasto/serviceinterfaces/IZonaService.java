package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.ZonaDTO;

import java.util.List;

public interface IZonaService {

    List<ZonaDTO> listar();

    List<ZonaDTO> listarActivas();

    ZonaDTO insertar(ZonaDTO dto);

    ZonaDTO actualizar(Integer idZona, ZonaDTO dto);

    void eliminar(Integer idZona);
}
