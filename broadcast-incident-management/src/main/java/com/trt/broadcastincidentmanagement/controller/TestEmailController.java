package com.trt.broadcastincidentmanagement.controller;

import com.trt.broadcastincidentmanagement.service.EmailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestEmailController {

    private final EmailService emailService;

    public TestEmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/email")
    public String testEmail() throws Exception {

        emailService.sendTestEmail(
                "deneme.trt.broadcast.incident@gmail.com"
        );

        return "Test maili gönderildi.";
    }
}