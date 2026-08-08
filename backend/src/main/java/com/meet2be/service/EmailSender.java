package com.meet2be.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Thin wrapper around JavaMailSender so callers don't build MimeMessage by hand.
 * Sends HTML bodies (not plain SimpleMailMessage) since campaign emails embed a
 * tracking pixel and a click-tracked CTA link. Kept as a plain component (no
 * interface split) since it's a stateless infrastructure adapter, not a
 * business-logic service.
 */
@Slf4j
@Component
public class EmailSender {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailSender(JavaMailSender mailSender, @Value("${meet2be.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    /**
     * Sends one email on the dedicated "emailTaskExecutor" thread pool so a
     * campaign's recipients are dispatched concurrently instead of one by one.
     */
    @Async("emailTaskExecutor")
    public CompletableFuture<Boolean> sendAsync(String to, String subject, String htmlBody) {
        return CompletableFuture.completedFuture(send(to, subject, htmlBody));
    }

    /**
     * Sends one HTML email, swallowing send failures (bad address, SMTP hiccup
     * for this one message) so a single failure doesn't stop the rest of a
     * campaign. Returns whether the send succeeded.
     */
    public boolean send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            return true;
        } catch (MailException | MessagingException e) {
            log.warn("ActionLog.send : Failed to send email, reason={}", e.getMessage());
            return false;
        }
    }
}
