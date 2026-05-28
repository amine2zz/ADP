package com.adp.hcm.repository;

import com.adp.hcm.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByPositionIdOrderByAppliedDateDesc(Long positionId);
    List<JobApplication> findAllByOrderByAppliedDateDesc();
    long countByPositionId(Long positionId);
    long countByStatus(String status);
}
