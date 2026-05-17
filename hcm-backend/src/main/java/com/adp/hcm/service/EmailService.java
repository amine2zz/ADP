package com.adp.hcm.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendSetupEmail(String toEmail, String activationToken) {
        String setupUrl = "http://localhost:4200/setup-account?token=" + activationToken;
        System.out.println("==================================================");
        System.out.println("[EMAIL] TO: " + toEmail);
        System.out.println("Subject: Welcome to ADP Nexus - Setup your Account");
        System.out.println("Setup URL: " + setupUrl);
        System.out.println("==================================================");
    }

    public void sendApplicationConfirmation(String toEmail, String trackingToken) {
        String trackUrl = "http://localhost:4200/careers/track?token=" + trackingToken;
        System.out.println("==================================================");
        System.out.println("[EMAIL] TO: " + toEmail);
        System.out.println("Subject: Application Received - Track Your Progress");
        System.out.println("Track URL: " + trackUrl);
        System.out.println("==================================================");
    }

    public void sendWelcomeEmail(String toEmail, String firstName) {
        System.out.println("==================================================");
        System.out.println("[EMAIL] TO: " + toEmail);
        System.out.println("Subject: Welcome to the team, " + firstName + "!");
        System.out.println("==================================================");
    }
}
