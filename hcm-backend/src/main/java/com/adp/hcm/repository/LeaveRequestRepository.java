package com.adp.hcm.repository;

import com.adp.hcm.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeManagerId(Long managerId);
    List<LeaveRequest> findByEmployeeId(Long employeeId);
}
