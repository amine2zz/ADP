package com.adp.hcm.repository;

import com.adp.hcm.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployeeManagerId(Long managerId);
    List<Attendance> findByEmployeeId(Long employeeId);
}
