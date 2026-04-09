package com.adp.hcm.repository;

import com.adp.hcm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);
    Optional<Employee> findByActivationToken(String token);
    Optional<Employee> findByEmail(String email);
    java.util.List<Employee> findByManagerId(Long managerId);
}
