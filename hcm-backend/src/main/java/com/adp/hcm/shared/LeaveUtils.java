package com.adp.hcm.shared;

import java.time.LocalDate;

public final class LeaveUtils {

    private LeaveUtils() {}

    public static long countWeekdays(LocalDate start, LocalDate end) {
        long days = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            if (current.getDayOfWeek().getValue() < 6) {
                days++;
            }
            current = current.plusDays(1);
        }
        return days;
    }
}
