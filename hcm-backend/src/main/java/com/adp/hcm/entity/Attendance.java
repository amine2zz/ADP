package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private LocalDateTime morningIn;
    private LocalDateTime lunchOut;
    private LocalDateTime afternoonIn;
    private LocalDateTime eveningOut;

    private LocalDate workDate;
    private String status;
}
