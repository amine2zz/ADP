package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "operation_history")
@Data
public class OperationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actor; // email of the person who did the action
    private String operation; // e.g., CREATED_EMPLOYEE, APPROVED_LEAVE
    private String target; // who was affected
    private String description;
    
    private LocalDateTime timestamp = LocalDateTime.now();
}
