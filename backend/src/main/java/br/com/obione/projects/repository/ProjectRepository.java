package br.com.obione.projects.repository;

import br.com.obione.projects.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByDomain_Id(Long domainId);

    Optional<Project> findByName(String name);
}
