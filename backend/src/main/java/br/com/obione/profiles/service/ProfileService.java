package br.com.obione.profiles.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.profiles.dto.ProfileResponse;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.mapper.ProfileMapper;
import br.com.obione.profiles.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public List<ProfileResponse> findAll() {
        return profileRepository.findAll().stream()
                .map(ProfileMapper::toResponse)
                .toList();
    }

    public ProfileResponse findByCode(ProfileCode code) {
        return profileRepository.findByCode(code)
                .map(ProfileMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + code));
    }
}
