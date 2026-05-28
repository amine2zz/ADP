package com.adp.hcm.controller.dto;

import lombok.Data;

@Data
public class SetupRequest {
    private String token;
    private String newPassword;
    private String address;
    private String phoneNumber;
    private String dateOfBirth;
}
