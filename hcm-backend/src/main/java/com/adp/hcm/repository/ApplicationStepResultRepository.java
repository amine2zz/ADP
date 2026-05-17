package com.adp.hcm.repository;

import com.adp.hcm.entity.ApplicationStepResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationStepResultRepository extends JpaRepository<ApplicationStepResult, Long> {
    List<ApplicationStepResult> findByApplicationId(Long applicationId);
}
