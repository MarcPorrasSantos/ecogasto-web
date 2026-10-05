package pe.edu.upc.ecogasto.serviceinterfaces;

import pe.edu.upc.ecogasto.dtos.PublicacionDTO;

import java.util.List;

public interface IPublicacionService {

    List<PublicacionDTO> listar();                 // HU14

    PublicacionDTO insertar(PublicacionDTO dto);   // HU14

    void eliminar(Integer idPublicacion);          // HU14
}
