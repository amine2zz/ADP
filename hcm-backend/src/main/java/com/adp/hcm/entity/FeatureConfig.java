package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "features_config")
public class FeatureConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feature_key", unique = true, nullable = false, length = 100)
    private String featureKey;

    @Column(name = "feature_label", nullable = false)
    private String featureLabel;

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "is_core")
    private Boolean isCore = false;

    @Column(name = "parent_feature_key", length = 100)
    private String parentFeatureKey;
}
