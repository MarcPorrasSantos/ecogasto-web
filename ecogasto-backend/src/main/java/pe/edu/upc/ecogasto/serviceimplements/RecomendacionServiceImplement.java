package pe.edu.upc.ecogasto.serviceimplements;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pe.edu.upc.ecogasto.dtos.RecomendacionDTO;
import pe.edu.upc.ecogasto.entities.*;
import pe.edu.upc.ecogasto.repositories.*;
import pe.edu.upc.ecogasto.serviceinterfaces.IRecomendacionService;
import pe.edu.upc.ecogasto.util.Numeros;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class RecomendacionServiceImplement implements IRecomendacionService {

    @Autowired
    private RecomendacionRepository reR;
    @Autowired
    private UsuarioRepository uR;
    @Autowired
    private HogarRepository hR;
    @Autowired
    private ConsumoRepository cR;
    @Autowired
    private RecursoRepository rR;
    @Autowired
    private EcoTipRepository etR;

    @Value("${ecogasto.ia.api-key:}")
    private String apiKey;

    @Value("${ecogasto.ia.url}")
    private String apiUrl;

    @Override
    public RecomendacionDTO generarPersonalizada(Integer idUsuario) {
        Usuario usuario = uR.findById(idUsuario)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
        Hogar hogar = hR.findByUsuario_IdUsuario(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Primero registra los datos de tu hogar"));

        List<Object[]> filas = cR.recursoMasAlto(idUsuario);
        if (filas.isEmpty()) {
            throw new IllegalArgumentException("Registra al menos una lectura de consumo para recibir tu tip");
        }
        Object[] fila = filas.get(0);
        Integer idRecurso = Numeros.aEntero(fila[0]);
        String nombreRecurso = (String) fila[1];
        Double valor = Numeros.aDouble(fila[2]);
        Double promedio = Numeros.aDouble(fila[3]);
        String unidad = (String) fila[4];

        String prompt = "Eres el asesor de ahorro de EcoGasto, una app peruana. "
                + "Hogar de " + hogar.getNumPersonas() + " personas en la " + hogar.getZona().getNombre()
                + ", segmento: " + usuario.getSegmento() + ". "
                + "Su ultimo consumo de " + nombreRecurso + " fue " + valor + " " + unidad
                + " y el promedio nacional es " + promedio + " " + unidad + ". "
                + "Da UN solo consejo practico en espanol, de maximo 2 oraciones, para reducir ese consumo.";

        String texto = null;
        String origen = "IA";
        if (apiKey != null && !apiKey.isBlank()) {
            texto = consultarIA(prompt);
        }

        if (texto == null || texto.isBlank()) {
            origen = "CATALOGO";
            EcoTip tip = etR.tipAleatorio(idRecurso, usuario.getSegmento());
            texto = tip != null ? tip.getTexto()
                    : "Revisa tus habitos de consumo de " + nombreRecurso + " esta semana.";
        }
        if (texto.length() > 600) {
            texto = texto.substring(0, 600);
        }

        Recurso recurso = rR.findById(idRecurso).orElseThrow();
        Recomendacion r = new Recomendacion();
        r.setUsuario(usuario);
        r.setRecurso(recurso);
        r.setTexto(texto.trim());
        r.setOrigen(origen);
        r.setFecha(LocalDateTime.now());
        return aDTO(reR.save(r));
    }

    @Override
    public RecomendacionDTO valorar(Integer idRecomendacion, Boolean util) {
        Recomendacion r = reR.findById(idRecomendacion)
                .orElseThrow(() -> new NoSuchElementException("Recomendacion no encontrada"));
        r.setUtil(util);
        return aDTO(reR.save(r));
    }

    private String consultarIA(String prompt) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            Map<String, Object> parte = Map.of("text", prompt);
            Map<String, Object> contenido = Map.of("parts", List.of(parte));
            Map<String, Object> cuerpo = Map.of("contents", List.of(contenido));

            HttpEntity<Map<String, Object>> peticion = new HttpEntity<>(cuerpo, headers);
            JsonNode respuesta = restTemplate.postForObject(apiUrl, peticion, JsonNode.class);
            if (respuesta == null) {
                return null;
            }
            return respuesta.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText(null);
        } catch (Exception e) {
            System.out.println("No se pudo consultar la IA: " + e.getMessage());
            return null;
        }
    }

    private RecomendacionDTO aDTO(Recomendacion r) {
        RecomendacionDTO dto = new RecomendacionDTO();
        dto.setIdRecomendacion(r.getIdRecomendacion());
        dto.setRecurso(r.getRecurso().getNombre());
        dto.setTexto(r.getTexto());
        dto.setOrigen(r.getOrigen());
        dto.setUtil(r.getUtil());
        dto.setFecha(r.getFecha());
        return dto;
    }
}
