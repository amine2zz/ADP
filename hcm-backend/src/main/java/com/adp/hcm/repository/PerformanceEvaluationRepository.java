package com.adp.hcm.repository;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.PerformanceEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PerformanceEvaluationRepository extends JpaRepository<PerformanceEvaluation, Long> {
    List<PerformanceEvaluation> findByEmployee(Employee employee);
    List<PerformanceEvaluation> findByEvaluator(Employee evaluator);
    Optional<PerformanceEvaluation> findByEmployeeAndPeriod(Employee employee, String period);

    @Query("SELECT DISTINCT e FROM PerformanceEvaluation e LEFT JOIN FETCH e.responses WHERE e.period = :period")
    List<PerformanceEvaluation> findByPeriodWithDetails(@Param("period") String period);
}
