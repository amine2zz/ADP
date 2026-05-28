package com.adp.hcm.repository;

import com.adp.hcm.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {
    List<SystemConfig> findByCategory(String category);
}
