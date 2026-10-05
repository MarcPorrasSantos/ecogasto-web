package pe.edu.upc.ecogasto.securities;

public class JwtResponse {

    private String token;
    private Integer idUsuario;
    private String username;
    private String rol;
    private Boolean tieneHogar;

    public JwtResponse(String token, Integer idUsuario, String username, String rol, Boolean tieneHogar) {
        this.token = token;
        this.idUsuario = idUsuario;
        this.username = username;
        this.rol = rol;
        this.tieneHogar = tieneHogar;
    }

    public String getToken() {
        return token;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getUsername() {
        return username;
    }

    public String getRol() {
        return rol;
    }

    public Boolean getTieneHogar() {
        return tieneHogar;
    }
}
