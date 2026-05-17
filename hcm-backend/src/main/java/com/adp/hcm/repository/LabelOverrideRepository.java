package com.adp.hcm.repository;

import com.adp.hcm.entity.LabelOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabelOverrideRepository extends JpaRepository<LabelOverride, Long> {
    Optional<LabelOverride> findByLabelKey(String labelKey);
}
