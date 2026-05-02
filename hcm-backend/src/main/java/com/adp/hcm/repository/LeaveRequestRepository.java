package com.adp.hcm.repository;

import com.adp.hcm.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeManagerId(Long managerId);
    
    @org.springframework.data.jpa.repository.Query("SELECT l FROM LeaveRequest l WHERE l.employee.id = :employeeId")
    List<LeaveRequest> findByEmployeeId(@org.springframework.data.repository.query.Param("employeeId") Long employeeId);
}
