package com.adp.hcm.repository;

import com.adp.hcm.entity.PerformanceQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceQuestionRepository extends JpaRepository<PerformanceQuestion, Long> {
    List<PerformanceQuestion> findByActiveTrue();
}
