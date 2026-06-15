package br.com.obione.auth.controller;

import br.com.obione.auth.dto.CurrentUserDTO;
import br.com.obione.auth.dto.LoginRequestDTO;
import br.com.obione.auth.dto.LoginResponseDTO;
import br.com.obione.auth.dto.RegisterRequestDTO;
import br.com.obione.auth.service.AuthService;
import br.com.obione.users.dto.UserResponseDTO;
import br.com.obione.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Autenticação de usuários")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuário")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Solicitar acesso (auto-cadastro como cliente pendente de aprovação)")
    public UserResponseDTO register(@Valid @RequestBody RegisterRequestDTO request) {
        return userService.register(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Encerrar a sessão do token atual")
    public void logout(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        authService.logout(authorization);
    }

    @GetMapping("/me")
    @Operation(summary = "Obter usuário autenticado da sessão mock")
    public CurrentUserDTO getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return authService.getCurrentUser(authorization);
    }
}
