package com.adp.hcm.repository;

import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeManagerId(Long managerId);

    @Query("SELECT a FROM Attendance a WHERE a.employee.id = :employeeId")
    List<Attendance> findByEmployeeId(@Param("employeeId") Long employeeId);

    Optional<Attendance> findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    List<Attendance> findByEmployeeAndWorkDateBetween(Employee employee, LocalDate start, LocalDate end);
}
