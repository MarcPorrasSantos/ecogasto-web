package pe.edu.upc.ecogasto.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import pe.edu.upc.ecogasto.dtos.MensajeDTO;
import pe.edu.upc.ecogasto.dtos.RegistroDTO;
import pe.edu.upc.ecogasto.dtos.UsuarioDTO;
import pe.edu.upc.ecogasto.entities.Usuario;
import pe.edu.upc.ecogasto.repositories.UsuarioRepository;
import pe.edu.upc.ecogasto.securities.JwtRequest;
import pe.edu.upc.ecogasto.securities.JwtResponse;
import pe.edu.upc.ecogasto.securities.JwtTokenUtil;
import pe.edu.upc.ecogasto.securities.JwtUserDetailsService;
import pe.edu.upc.ecogasto.serviceinterfaces.IAuditoriaService;
import pe.edu.upc.ecogasto.serviceinterfaces.IUsuarioService;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticacion", description = "HU01 Registro y HU02 Inicio de sesion")
public class AuthController {

    private static final int MAX_INTENTOS = 5;

    @Autowired
    private IUsuarioService usuarioService;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUserDetailsService userDetailsService;
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    @Autowired
    private UsuarioRepository uR;
    @Autowired
    private IAuditoriaService auditoriaService;

    @Operation(summary = "EP01 - Registrar una cuenta nueva")
    @PostMapping("/registro")
    public ResponseEntity<UsuarioDTO> registrar(@Valid @RequestBody RegistroDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(dto));
    }

    @Operation(summary = "EP02 - Iniciar sesion y obtener el token JWT")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody JwtRequest request) {
        Usuario usuario = uR.findByUsername(request.getUsername()).orElse(null);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(new MensajeDTO("Tu cuenta esta bloqueada. Comunicate con el administrador."));
        } catch (BadCredentialsException e) {
            if (usuario != null) {
                sumarIntentoFallido(usuario);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MensajeDTO("Usuario o contrasena incorrectos"));
        }

        usuario.setIntentosFallidos(0);
        uR.save(usuario);
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtTokenUtil.generarToken(userDetails);
        String rol = usuario.getRol().getNombre();
        if (rol.equals("ADMIN")) {
            auditoriaService.registrar(usuario, "ACCESO", "usuarios", "Inicio de sesion del administrador");
        }
        UsuarioDTO datos = usuarioService.buscarPorUsername(usuario.getUsername());
        return ResponseEntity.ok(new JwtResponse(token, usuario.getIdUsuario(), usuario.getUsername(), rol, datos.getTieneHogar()));
    }

    private void sumarIntentoFallido(Usuario usuario) {
        usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);
        if (usuario.getIntentosFallidos() >= MAX_INTENTOS) {
            usuario.setActivo(false);
        }
        uR.save(usuario);
        auditoriaService.registrar(usuario, "ACCESO_FALLIDO", "usuarios",
                "Intento fallido " + usuario.getIntentosFallidos() + " de " + MAX_INTENTOS);
    }
}
