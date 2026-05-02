package com.adp.hcm.repository;

import com.adp.hcm.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployeeManagerId(Long managerId);
    List<Attendance> findByEmployeeId(Long employeeId);
    Optional<Attendance> findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);
}
