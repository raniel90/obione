package br.com.obione.permissions.service;

import br.com.obione.permissions.dto.PermissionResponse;
import br.com.obione.permissions.mapper.PermissionMapper;
import br.com.obione.permissions.repository.PermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionRepository permissionRepository;

    public PermissionService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    public List<PermissionResponse> findAll() {
        return permissionRepository.findAll().stream()
                .map(PermissionMapper::toResponse)
                .toList();
    }
}
