package com.church.baptism.service.auth;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTwoFactorCode(String toEmail, String code) {
        sendHtml(toEmail, "BMPMS - Two-Factor Authentication Code",
            "<h2>Two-Factor Authentication Code</h2>" +
            "<p>Your verification code is:</p>" +
            "<div style='font-size:24px;font-weight:bold;padding:12px;background:#f3f4f6;text-align:center;letter-spacing:4px;border-radius:6px;'>" + code + "</div>" +
            "<p style='color:#666;'>This code will expire in <strong>10 minutes</strong>.</p>" +
            "<p style='color:#666;'>If you did not request this code, please ignore this email.</p>"
        );
    }

    public void sendPasswordResetLink(String toEmail, String token) {
        String link = baseUrl + "/reset-password?token=" + token;
        sendHtml(toEmail, "BMPMS - Password Reset",
            "<h2>Password Reset</h2>" +
            "<p>You requested a password reset. Click the button below to reset your password:</p>" +
            "<div style='text-align:center;margin:24px 0;'>" +
            "<a href='" + link + "' style='display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;'>Reset Password</a>" +
            "</div>" +
            "<p>Or copy this link into your browser:</p>" +
            "<p style='font-size:12px;color:#666;word-break:break-all;'>" + link + "</p>" +
            "<p style='color:#666;'>This link will expire in <strong>15 minutes</strong>.</p>" +
            "<p style='color:#666;'>If you did not request this, please ignore this email.</p>"
        );
    }

    public void sendEmailVerification(String toEmail, String token) {
        String link = baseUrl + "/verify-email?token=" + token;
        sendHtml(toEmail, "BMPMS - Verify Your Email Address",
            "<h2>Welcome to BMPMS!</h2>" +
            "<p>Thank you for registering. Please verify your email address by clicking the button below:</p>" +
            "<div style='text-align:center;margin:24px 0;'>" +
            "<a href='" + link + "' style='display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;'>Verify Email</a>" +
            "</div>" +
            "<p>Or copy this link into your browser:</p>" +
            "<p style='font-size:12px;color:#666;word-break:break-all;'>" + link + "</p>" +
            "<p style='color:#666;'>This link will expire in <strong>24 hours</strong>.</p>" +
            "<p style='color:#666;'>If you did not create an account, please ignore this email.</p>"
        );
    }

    public void sendNotification(String toEmail, String subject, String body) {
        sendHtml(toEmail, subject,
            "<h2>" + subject + "</h2>" +
            "<p>" + body.replace("\n", "<br/>") + "</p>"
        );
    }

    private void sendHtml(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(wrapHtml(htmlContent), true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }

    private String wrapHtml(String content) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'></head>" +
               "<body style='font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;'>" +
               "<div style='max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);'>" +
               "<div style='background:#2563eb;padding:24px;text-align:center;'>" +
               "<h1 style='color:#fff;margin:0;font-size:20px;'>Baptism Membership System</h1>" +
               "</div>" +
               "<div style='padding:32px;'>" + content + "</div>" +
               "<div style='padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;'>" +
               "<p style='margin:0;'>&copy; 2026 BMPMS. All rights reserved.</p>" +
               "</div></div></body></html>";
    }
}
