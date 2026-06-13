package com.adp.hcm.repository;

import com.adp.hcm.entity.AiReportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiReportHistoryRepository extends JpaRepository<AiReportHistory, Long> {
    List<AiReportHistory> findByReportTypeOrderByGeneratedAtDesc(String reportType);
    List<AiReportHistory> findByReportTypeAndManagerIdOrderByGeneratedAtDesc(String reportType, Long managerId);
}
