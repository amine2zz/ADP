package com.adp.hcm.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendSetupEmail(String toEmail, String activationToken) {
        String setupUrl = "http://localhost:4200/setup-account?token=" + activationToken;
        System.out.println("==================================================");
        System.out.println("EMAIL TO: " + toEmail);
        System.out.println("Subject: Welcome to ADP Nexus - Setup your Account");
        System.out.println("Setup URL: " + setupUrl);
        System.out.println("==================================================");
    }
}
