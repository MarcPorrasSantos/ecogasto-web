package pe.edu.upc.ecogasto.serviceimplements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.upc.ecogasto.dtos.*;
import pe.edu.upc.ecogasto.repositories.InsigniaUsuarioRepository;
import pe.edu.upc.ecogasto.repositories.ReporteRepository;
import pe.edu.upc.ecogasto.repositories.RetoUsuarioRepository;
import pe.edu.upc.ecogasto.serviceinterfaces.IReporteService;
import pe.edu.upc.ecogasto.util.Numeros;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReporteServiceImplement implements IReporteService {

    @Autowired
    private ReporteRepository rpR;
    @Autowired
    private RetoUsuarioRepository ruR;
    @Autowired
    private InsigniaUsuarioRepository iuR;

    @Override
    public List<ImpactoDTO> impactoAmbiental(Integer idHogar, Integer anio, Integer mes) {
        List<ImpactoDTO> lista = new ArrayList<>();
        for (Object[] f : rpR.impactoAmbiental(idHogar, anio, mes)) {
            ImpactoDTO dto = new ImpactoDTO();
            dto.setRecurso((String) f[0]);
            dto.setValor(Numeros.aDouble(f[1]));
            dto.setUnidad((String) f[2]);
            dto.setCo2Kg(Numeros.aDouble(f[3]));
            dto.setLitrosMes(Numeros.aDouble(f[4]));
            lista.add(dto);
        }
        return lista;
    }

    @Override
    public List<ComparacionDTO> comparacionNacional(Integer idHogar, Integer anio, Integer mes) {
        List<ComparacionDTO> lista = new ArrayList<>();
        for (Object[] f : rpR.comparacionNacional(idHogar, anio, mes)) {
            ComparacionDTO dto = new ComparacionDTO();
            dto.setRecurso((String) f[0]);
            dto.setMiValor(Numeros.aDouble(f[1]));
            dto.setPromedioReferencia(Numeros.aDouble(f[2]));
            dto.setDiferenciaPct(Numeros.aDouble(f[3]));
            lista.add(dto);
        }
        return lista;
    }

    @Override
    public List<ComparacionDTO> hogaresSimilares(Integer idHogar, Integer anio, Integer mes) {
        List<ComparacionDTO> lista = new ArrayList<>();
        for (Object[] f : rpR.hogaresSimilares(idHogar, anio, mes)) {
            ComparacionDTO dto = new ComparacionDTO();
            dto.setRecurso((String) f[0]);
            dto.setMiValor(Numeros.aDouble(f[1]));
            dto.setPromedioReferencia(Numeros.aDouble(f[2]));
            dto.setCantidadHogares(Numeros.aEntero(f[3]));
            double diferencia = (dto.getMiValor() - dto.getPromedioReferencia()) * 100 / dto.getPromedioReferencia();
            dto.setDiferenciaPct(Math.round(diferencia * 10) / 10.0);
            lista.add(dto);
        }
        return lista;
    }

    @Override
    public List<PromedioZonaDTO> promedioMensualZona(Integer idZona, Integer anio) {
        return aPromedios(rpR.promedioMensualZona(idZona, anio));
    }

    @Override
    public List<PromedioZonaDTO> promedioMensualTodas(Integer anio) {
        return aPromedios(rpR.promedioMensualTodas(anio));
    }

    @Override
    public List<RankingDTO> ranking(String zona, String segmento) {
        List<RankingDTO> lista = new ArrayList<>();
        int posicion = 1;
        for (Object[] f : rpR.ranking(zona, segmento)) {
            RankingDTO dto = new RankingDTO();
            dto.setPosicion(posicion);
            dto.setUsername((String) f[0]);
            dto.setPuntos(Numeros.aEntero(f[1]));
            dto.setZona((String) f[2]);
            dto.setSegmento((String) f[3]);
            lista.add(dto);
            posicion++;
        }
        return lista;
    }

    @Override
    public ResumenLogrosDTO resumenLogros(Integer idUsuario) {
        ResumenLogrosDTO dto = new ResumenLogrosDTO();
        dto.setPuntos(ruR.puntosTotales(idUsuario));
        dto.setRetosCompletados(ruR.countByUsuario_IdUsuarioAndEstado(idUsuario, "COMPLETADO"));
        dto.setInsignias(iuR.countByUsuario_IdUsuario(idUsuario));

        List<Object[]> costos = rpR.costosUltimosMeses(idUsuario);   // [0] = ultimo mes, [1] = anterior
        if (costos.size() >= 1) {
            dto.setCostoUltimoMes(Numeros.aDouble(costos.get(0)[2]));
        }
        if (costos.size() == 2) {
            dto.setCostoMesAnterior(Numeros.aDouble(costos.get(1)[2]));
            double variacion = (dto.getCostoUltimoMes() - dto.getCostoMesAnterior()) * 100 / dto.getCostoMesAnterior();
            dto.setVariacionPct(Math.round(variacion * 10) / 10.0);
        }
        return dto;
    }

    @Override
    public IndicadoresDTO indicadores() {
        Object[] f = rpR.indicadores().get(0);
        IndicadoresDTO dto = new IndicadoresDTO();
        dto.setUsuarios(Numeros.aEntero(f[0]));
        dto.setHogares(Numeros.aEntero(f[1]));
        dto.setLecturas(Numeros.aEntero(f[2]));
        dto.setAlertas(Numeros.aEntero(f[3]));
        dto.setPctConCarencia(Numeros.aDouble(f[4]));
        return dto;
    }

    @Override
    public List<NivelConsumoDTO> nivelConsumo() {
        List<NivelConsumoDTO> lista = new ArrayList<>();
        for (Object[] f : rpR.nivelConsumo()) {
            NivelConsumoDTO dto = new NivelConsumoDTO();
            dto.setRecurso((String) f[0]);
            dto.setBajo(Numeros.aEntero(f[1]));
            dto.setModerado(Numeros.aEntero(f[2]));
            dto.setAlto(Numeros.aEntero(f[3]));
            lista.add(dto);
        }
        return lista;
    }

    @Override
    public List<CarenciaDTO> carenciasPorZona() {
        List<CarenciaDTO> lista = new ArrayList<>();
        for (Object[] f : rpR.carenciasPorZona()) {
            CarenciaDTO dto = new CarenciaDTO();
            dto.setZona((String) f[0]);
            dto.setRecurso((String) f[1]);
            dto.setTotalHogares(Numeros.aEntero(f[2]));
            dto.setSinServicio(Numeros.aEntero(f[3]));
            dto.setPorcentaje(Numeros.aDouble(f[4]));
            lista.add(dto);
        }
        return lista;
    }

    private List<PromedioZonaDTO> aPromedios(List<Object[]> filas) {
        List<PromedioZonaDTO> lista = new ArrayList<>();
        for (Object[] f : filas) {
            PromedioZonaDTO dto = new PromedioZonaDTO();
            dto.setZona((String) f[0]);
            dto.setMes(Numeros.aEntero(f[1]));
            dto.setRecurso((String) f[2]);
            dto.setPromedio(Numeros.aDouble(f[3]));
            lista.add(dto);
        }
        return lista;
    }
}
