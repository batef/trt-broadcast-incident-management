package com.trt.broadcastincidentmanagement.repository;

import com.trt.broadcastincidentmanagement.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByAssignedToId(Long userId);

    List<Incident> findByCreatedById(Long userId);
}