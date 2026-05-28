package com.adp.hcm.repository;

import com.adp.hcm.entity.JobPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPositionRepository extends JpaRepository<JobPosition, Long> {
    List<JobPosition> findByStatusOrderByPostedDateDesc(String status);
    List<JobPosition> findAllByOrderByPostedDateDesc();
    long countByStatus(String status);
}
