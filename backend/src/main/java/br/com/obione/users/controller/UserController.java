package br.com.obione.users.controller;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.dto.CreateUserRequestDTO;
import br.com.obione.users.dto.UpdateUserRequestDTO;
import br.com.obione.users.dto.UserResponseDTO;
import br.com.obione.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Gestão de usuários do observatório")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Listar todos os usuários")
    public List<UserResponseDTO> listUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por ID")
    public UserResponseDTO getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar usuário")
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserRequestDTO request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar usuário")
    public UserResponseDTO updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequestDTO request
    ) {
        return userService.update(id, request);
    }

    @GetMapping("/profile/{profileCode}")
    @Operation(summary = "Listar usuários por perfil")
    public List<UserResponseDTO> listUsersByProfile(@PathVariable ProfileCode profileCode) {
        return userService.findByProfileCode(profileCode);
    }
}
