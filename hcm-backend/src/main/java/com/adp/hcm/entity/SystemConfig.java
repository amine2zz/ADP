package com.adp.hcm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "system_config")
public class SystemConfig {

    @Id
    @Column(name = "config_key", nullable = false)
    private String configKey;

    @Column(name = "config_value", length = 2000)
    private String configValue;

    @Column(name = "category")
    private String category;       // GENERAL | THEME | FEATURE

    @Column(name = "label")
    private String label;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "optional")
    private boolean optional;      // false = core / cannot be disabled

    @Column(name = "input_type")
    private String inputType;      // TEXT | COLOR | BOOLEAN | URL

    public String getConfigKey()                { return configKey; }
    public void   setConfigKey(String v)        { this.configKey = v; }
    public String getConfigValue()              { return configValue; }
    public void   setConfigValue(String v)      { this.configValue = v; }
    public String getCategory()                 { return category; }
    public void   setCategory(String v)         { this.category = v; }
    public String getLabel()                    { return label; }
    public void   setLabel(String v)            { this.label = v; }
    public String getDescription()              { return description; }
    public void   setDescription(String v)      { this.description = v; }
    public boolean isOptional()                 { return optional; }
    public void   setOptional(boolean v)        { this.optional = v; }
    public String getInputType()                { return inputType; }
    public void   setInputType(String v)        { this.inputType = v; }
}
