package br.com.obione.projects.repository;

import br.com.obione.projects.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByDomain_Id(Long domainId);

    Optional<Project> findByName(String name);

    // Client-scoped finders — used when the authenticated user has role CLIENT
    List<Project> findByClient_Id(Long clientId);

    Optional<Project> findByIdAndClient_Id(Long id, Long clientId);

    List<Project> findByDomain_IdAndClient_Id(Long domainId, Long clientId);
}
