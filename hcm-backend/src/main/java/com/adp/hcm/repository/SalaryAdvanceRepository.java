package com.adp.hcm.repository;

import com.adp.hcm.entity.SalaryAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryAdvanceRepository extends JpaRepository<SalaryAdvance, Long> {
    List<SalaryAdvance> findByEmployeeIdOrderByRequestDateDesc(Long employeeId);
    List<SalaryAdvance> findByStatusOrderByRequestDateDesc(String status);
    List<SalaryAdvance> findAllByOrderByRequestDateDesc();
    long countByStatus(String status);
}
