package com.adp.hcm.repository;

import com.adp.hcm.entity.PipelineStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineStepRepository extends JpaRepository<PipelineStep, Long> {
    List<PipelineStep> findByJobOfferIdOrderByStepOrder(Long jobOfferId);
}
