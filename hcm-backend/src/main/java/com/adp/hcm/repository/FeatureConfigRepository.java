package com.adp.hcm.repository;

import com.adp.hcm.entity.FeatureConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeatureConfigRepository extends JpaRepository<FeatureConfig, Long> {
    Optional<FeatureConfig> findByFeatureKey(String featureKey);
}
