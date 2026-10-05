package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.HogarDTO;

public interface IHogarService {

    HogarDTO registrar(HogarDTO dto);                   // HU03

    HogarDTO buscarPorUsuario(Integer idUsuario);       // HU03

    HogarDTO actualizar(Integer idHogar, HogarDTO dto); // HU03
}
