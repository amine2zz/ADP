package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
@Data
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    // The 4 punch timestamps
    private LocalDateTime morningIn;    // Clock In (start of work)
    private LocalDateTime lunchOut;     // Out for lunch
    private LocalDateTime afternoonIn;  // In after lunch
    private LocalDateTime eveningOut;   // Out of work

    private LocalDate workDate;         // The date this record belongs to

    // MORNING_IN, LUNCH_OUT, AFTERNOON_IN, EVENING_OUT, COMPLETED
    private String status;
}
