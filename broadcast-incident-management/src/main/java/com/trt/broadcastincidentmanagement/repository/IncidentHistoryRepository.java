package com.trt.broadcastincidentmanagement.repository;

import com.trt.broadcastincidentmanagement.entity.IncidentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentHistoryRepository
        extends JpaRepository<IncidentHistory, Long> {

    List<IncidentHistory> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);

    // Bir incident silinmeden önce ona ait geçmiş kayıtlarını temizlemek için.
    // IncidentHistory, incident'tan bağımsız bir anlam taşımadığından
    // (salt audit/log amaçlı), incident silindiğinde onunla birlikte silinir.
    void deleteByIncidentId(Long incidentId);
}