package com.adp.hcm.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendSetupEmail(String toEmail, String activationToken) {
        // In a real production application, you would use JavaMailSender here.
        // For the scope of this project testing, we simulate the email output in the console.
        
        String setupUrl = "http://localhost:4200/setup-account?token=" + activationToken;
        
        System.out.println("==================================================");
        System.out.println("📧 SIMULATED EMAIL SENT TO: " + toEmail);
        System.out.println("Subject: Welcome to ADP Nexus - Setup your Account");
        System.out.println("Body:");
        System.out.println("Hello,");
        System.out.println("Your HR Administrator has created an account for you.");
        System.out.println("Please click the link below to configure your password and complete your profile:");
        System.out.println(setupUrl);
        System.out.println("==================================================");
    }
}
