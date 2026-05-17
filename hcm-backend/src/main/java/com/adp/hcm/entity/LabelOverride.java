package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "label_override")
public class LabelOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "label_key", unique = true, nullable = false, length = 100)
    private String labelKey;

    @Column(name = "default_value", nullable = false)
    private String defaultValue;

    @Column(name = "custom_value")
    private String customValue;
}
