package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.RecomendacionDTO;

public interface IRecomendacionService {

    RecomendacionDTO generarPersonalizada(Integer idUsuario);      // HU07 (usa la API de IA)

    RecomendacionDTO valorar(Integer idRecomendacion, Boolean util); // HU07
}
