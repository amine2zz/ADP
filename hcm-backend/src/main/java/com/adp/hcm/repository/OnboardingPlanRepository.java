package com.adp.hcm.repository;

import com.adp.hcm.entity.OnboardingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OnboardingPlanRepository extends JpaRepository<OnboardingPlan, Long> {
    List<OnboardingPlan> findByEmployeeIdOrderByGeneratedAtDesc(Long employeeId);
}
