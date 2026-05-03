package com.adp.hcm.repository;

import com.adp.hcm.entity.PerformanceEvaluation;
import com.adp.hcm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PerformanceEvaluationRepository extends JpaRepository<PerformanceEvaluation, Long> {
    List<PerformanceEvaluation> findByEmployee(Employee employee);
    List<PerformanceEvaluation> findByEvaluator(Employee evaluator);
    Optional<PerformanceEvaluation> findByEmployeeAndPeriod(Employee employee, String period);
    
    @Query("SELECT e FROM PerformanceEvaluation e WHERE e.period = :period")
    List<PerformanceEvaluation> findByPeriod(@Param("period") String period);

    @Query("SELECT e FROM PerformanceEvaluation e WHERE e.employee.department.id = :deptId AND e.period = :period")
    List<PerformanceEvaluation> findByDepartmentAndPeriod(@Param("deptId") Long deptId, @Param("period") String period);

    @Query("SELECT e FROM PerformanceEvaluation e WHERE e.employee.department.id = :deptId")
    List<PerformanceEvaluation> findByDepartment(@Param("deptId") Long deptId);

    @Query("SELECT DISTINCT e FROM PerformanceEvaluation e LEFT JOIN FETCH e.employee LEFT JOIN FETCH e.responses")
    List<PerformanceEvaluation> findAllWithDetails();

    @Query("SELECT DISTINCT e FROM PerformanceEvaluation e LEFT JOIN FETCH e.employee LEFT JOIN FETCH e.responses WHERE e.employee.department.id = :deptId AND e.period = :period")
    List<PerformanceEvaluation> findByDepartmentAndPeriodWithDetails(@Param("deptId") Long deptId, @Param("period") String period);

    @Query("SELECT DISTINCT e FROM PerformanceEvaluation e LEFT JOIN FETCH e.employee LEFT JOIN FETCH e.responses WHERE e.employee.department.id = :deptId")
    List<PerformanceEvaluation> findByDepartmentWithDetails(@Param("deptId") Long deptId);

    @Query("SELECT DISTINCT e FROM PerformanceEvaluation e LEFT JOIN FETCH e.employee LEFT JOIN FETCH e.responses WHERE e.period = :period")
    List<PerformanceEvaluation> findByPeriodWithDetails(@Param("period") String period);
}
