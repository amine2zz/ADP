package com.adp.hcm.entity;

public enum PerformanceRating {
    STRONGLY_DISAGREE(1, "Strongly Disagree"),
    DISAGREE(2, "Disagree"),
    NEUTRAL(3, "Neutral"),
    AGREE(4, "Agree"),
    STRONGLY_AGREE(5, "Strongly Agree");

    private final int value;
    private final String label;

    PerformanceRating(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public int getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}
