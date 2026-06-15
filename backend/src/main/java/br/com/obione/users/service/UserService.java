package br.com.obione.users.service;

import br.com.obione.auth.dto.RegisterRequestDTO;
import br.com.obione.common.exception.DuplicateResourceException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.repository.ProfileRepository;
import br.com.obione.users.dto.CreateUserRequestDTO;
import br.com.obione.users.dto.UpdateUserRequestDTO;
import br.com.obione.users.dto.UserResponseDTO;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.mapper.UserMapper;
import br.com.obione.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findAll() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponseDTO findById(Long id) {
        return userRepository.findById(id)
                .map(UserMapper::toResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findByProfileCode(ProfileCode profileCode) {
        return userRepository.findByProfile_Code(profileCode).stream()
                .map(UserMapper::toResponseDTO)
                .toList();
    }

    /**
     * Public self-registration. The profile and status are forced server-side
     * to CLIENT / PENDING — never taken from the request — so an anonymous
     * visitor cannot grant themselves staff access. An administrator activates
     * the account (and assigns domains/projects) afterwards.
     */
    @Transactional
    public UserResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("E-mail já cadastrado: " + normalizedEmail);
        }

        Profile profile = profileRepository.findByCode(ProfileCode.CLIENT)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + ProfileCode.CLIENT));

        User user = User.builder()
                .name(request.name().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .profile(profile)
                .status(UserStatus.PENDING)
                .domainIds(UserMapper.copyList(null))
                .projectIds(UserMapper.copyList(null))
                .build();

        return UserMapper.toResponseDTO(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO create(CreateUserRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("E-mail já cadastrado: " + normalizedEmail);
        }

        Profile profile = profileRepository.findByCode(request.profileCode())
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + request.profileCode()));

        User user = User.builder()
                .name(request.name().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .profile(profile)
                .status(request.status())
                .domainIds(UserMapper.copyList(request.domainIds()))
                .projectIds(UserMapper.copyList(request.projectIds()))
                .build();

        return UserMapper.toResponseDTO(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO update(Long id, UpdateUserRequestDTO request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String normalizedEmail = normalizeEmail(request.email());
            if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
                throw new DuplicateResourceException("E-mail já cadastrado: " + normalizedEmail);
            }
            user.setEmail(normalizedEmail);
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        if (request.profileCode() != null) {
            Profile profile = profileRepository.findByCode(request.profileCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + request.profileCode()));
            user.setProfile(profile);
        }

        if (request.status() != null) {
            user.setStatus(request.status());
        }

        if (request.domainIds() != null) {
            user.setDomainIds(UserMapper.copyList(request.domainIds()));
        }

        if (request.projectIds() != null) {
            user.setProjectIds(UserMapper.copyList(request.projectIds()));
        }

        return UserMapper.toResponseDTO(userRepository.save(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
