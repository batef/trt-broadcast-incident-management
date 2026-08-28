package com.trt.broadcastincidentmanagement.service;

import com.trt.broadcastincidentmanagement.entity.Incident;
import com.trt.broadcastincidentmanagement.enums.IncidentStatus;
import com.trt.broadcastincidentmanagement.enums.Priority;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.url:http://localhost:3000}")
    private String appUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Yeni kullanıcı oluşturulduğunda gönderilen hoş geldin maili.
     */
    public void sendWelcomeEmail(
            String email,
            String name,
            String username,
            String temporaryPassword) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(email);

        helper.setSubject(
                "TRT Incident Management - Hesabınız Oluşturuldu"
        );

        String loginUrl = appUrl + "/login";

        String htmlContent = """
                <!DOCTYPE html>
                <html lang="tr">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">
                    <title>TRT Incident Management</title>
                </head>

                <body style="
                    margin:0;
                    padding:40px 20px;
                    background-color:#f4f6f8;
                    font-family:Arial, Helvetica, sans-serif;
                    color:#374151;
                ">

                    <div style="
                        max-width:600px;
                        margin:0 auto;
                        background:#ffffff;
                        border-radius:14px;
                        overflow:hidden;
                        box-shadow:0 4px 20px rgba(0,0,0,0.08);
                    ">

                        <!-- HEADER -->
                        <div style="
                            padding:28px 30px;
                            text-align:center;
                            border-bottom:1px solid #e5e7eb;
                        ">

                            <img
                                src="cid:trt-logo"
                                alt="TRT"
                                style="
                                    width:85px;
                                    height:auto;
                                    display:block;
                                    margin:0 auto 12px auto;
                                "
                            >

                            <div style="
                                color:#111827;
                                font-size:17px;
                                font-weight:bold;
                                letter-spacing:0.5px;
                            ">
                                BROADCAST INCIDENT MANAGEMENT
                            </div>

                        </div>

                        <!-- CONTENT -->
                        <div style="
                            padding:35px 40px;
                        ">

                            <h2 style="
                                margin:0 0 18px 0;
                                color:#111827;
                                font-size:25px;
                            ">
                                Merhaba %s,
                            </h2>

                            <p style="
                                font-size:15px;
                                line-height:1.7;
                                margin:0 0 12px 0;
                            ">
                                TRT Broadcast Incident Management
                                sistemindeki hesabınız başarıyla
                                oluşturulmuştur.
                            </p>

                            <p style="
                                font-size:15px;
                                line-height:1.7;
                                margin:0 0 25px 0;
                            ">
                                Aşağıdaki bilgiler ile sisteme
                                giriş yapabilirsiniz.
                            </p>

                            <!-- ACCOUNT INFORMATION -->
                            <div style="
                                border:1px solid #e5e7eb;
                                border-radius:10px;
                                padding:20px;
                                margin:25px 0;
                                background:#fafafa;
                            ">

                                <div style="
                                    margin-bottom:15px;
                                ">

                                    <div style="
                                        font-size:13px;
                                        color:#6b7280;
                                        margin-bottom:5px;
                                    ">
                                        Kullanıcı Adınız
                                    </div>

                                    <div style="
                                        background:#eef4ff;
                                        border-radius:7px;
                                        padding:12px;
                                        color:#111827;
                                        font-size:16px;
                                        font-weight:bold;
                                    ">
                                        %s
                                    </div>

                                </div>

                                <div>

                                    <div style="
                                        font-size:13px;
                                        color:#6b7280;
                                        margin-bottom:5px;
                                    ">
                                        Geçici Şifreniz
                                    </div>

                                    <div style="
                                        background:#fff1f2;
                                        border-radius:7px;
                                        padding:12px;
                                        color:#dc2626;
                                        font-size:16px;
                                        font-weight:bold;
                                        letter-spacing:1px;
                                    ">
                                        %s
                                    </div>

                                </div>

                            </div>

                            <!-- PASSWORD WARNING -->
                            <div style="
                                background:#eef6ff;
                                border-radius:9px;
                                padding:16px 18px;
                                margin:25px 0;
                                color:#1e40af;
                                font-size:14px;
                                line-height:1.6;
                            ">

                                <strong>Önemli:</strong>
                                İlk girişinizde güvenliğiniz için
                                şifrenizi değiştirmeniz gerekmektedir.

                            </div>

                            <!-- LOGIN BUTTON -->
                            <div style="
                                text-align:center;
                                margin:32px 0;
                            ">

                                <a href="%s"
                                   style="
                                       display:inline-block;
                                       background:#d40000;
                                       color:#ffffff;
                                       text-decoration:none;
                                       padding:15px 34px;
                                       border-radius:8px;
                                       font-size:15px;
                                       font-weight:bold;
                                   ">
                                    Sisteme Giriş Yap →
                                </a>

                            </div>

                            <p style="
                                text-align:center;
                                color:#6b7280;
                                font-size:13px;
                                line-height:1.6;
                                margin:0 0 30px 0;
                            ">
                                Yukarıdaki butona tıklayarak
                                sisteme giriş yapabilirsiniz.
                            </p>

                            <!-- DISCLAIMER -->
                            <div style="
                                border-top:1px solid #e5e7eb;
                                padding-top:20px;
                                color:#9ca3af;
                                font-size:11px;
                                line-height:1.7;
                            ">

                                <strong>Bilgilendirme</strong><br>

                                Bu sistem test amaçlı kullanılmaktadır.
                                Lütfen hassas kişisel bilgilerinizi
                                paylaşmayınız. Bu e-posta otomatik olarak
                                oluşturulmuştur; lütfen yanıtlamayınız.

                            </div>

                        </div>

                        <!-- FOOTER -->
                        <div style="
                            background:#f9fafb;
                            padding:20px;
                            text-align:center;
                            color:#9ca3af;
                            font-size:11px;
                            line-height:1.6;
                        ">

                            TRT Broadcast Incident Management<br><br>

                            © 2026 TRT – Tüm hakları saklıdır.

                        </div>

                    </div>

                </body>

                </html>
                """.formatted(
                name,
                username,
                temporaryPassword,
                loginUrl
        );

        helper.setText(htmlContent, true);

        ClassPathResource logo =
                new ClassPathResource("static/images/trt-logo.png");

        helper.addInline(
                "trt-logo",
                logo,
                "image/png"
        );

        mailSender.send(message);
    }


    /**
     * ============================================================
     * YENİ OLAY ATAMA MAILİ
     * ============================================================
     *
     * Bir olay teknisyene atandığında teknisyene
     * HTML formatında bildirim gönderir.
     */
    public void sendIncidentAssignedEmail(
            String email,
            String technicianUsername,
            Incident incident) throws MessagingException {

        MimeMessage message =
                mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(
                        message,
                        true,
                        "UTF-8"
                );

        helper.setTo(email);

        helper.setSubject(
                "Yeni Olay Ataması #" +
                        incident.getId() +
                        " - TRT Incident Management"
        );

        String incidentUrl =
                appUrl +
                        "/incidents/" +
                        incident.getId();

        String createdBy =
                incident.getCreatedBy() != null
                        ? incident.getCreatedBy().getUsername()
                        : "—";

        String assignedTo =
                incident.getAssignedTo() != null
                        ? incident.getAssignedTo().getUsername()
                        : technicianUsername;

        String createdAt =
                incident.getCreatedAt() != null
                        ? incident.getCreatedAt()
                        .format(
                                DateTimeFormatter.ofPattern(
                                        "dd.MM.yyyy HH:mm"
                                )
                        )
                        : "—";

        String priorityLabel =
                getPriorityLabel(
                        incident.getPriority()
                );

        String statusLabel =
                getStatusLabel(
                        incident.getStatus()
                );

        String priorityColor =
                getPriorityColor(
                        incident.getPriority()
                );

        String statusColor =
                getStatusColor(
                        incident.getStatus()
                );

        String description =
                incident.getDescription() != null
                        ? incident.getDescription()
                        : "Açıklama bulunmuyor.";

        /*
         * HTML'i normal String olarak oluşturuyoruz.
         *
         * .formatted() KULLANMIYORUZ.
         *
         * Böylece CSS içerisindeki %100 gibi değerler
         * Java tarafından formatlama karakteri olarak
         * yorumlanmıyor.
         */

        String htmlContent =
                "<!DOCTYPE html>" +
                        "<html lang=\"tr\">" +

                        "<head>" +
                        "<meta charset=\"UTF-8\">" +
                        "<meta name=\"viewport\" " +
                        "content=\"width=device-width, initial-scale=1.0\">" +
                        "<title>Yeni Olay Ataması</title>" +
                        "</head>" +

                        "<body style=\"" +
                        "margin:0;" +
                        "padding:40px 20px;" +
                        "background:#f4f6f8;" +
                        "font-family:-apple-system,BlinkMacSystemFont," +
                        "'Segoe UI',Arial,sans-serif;" +
                        "color:#1d1d1f;" +
                        "\">" +

                        "<div style=\"" +
                        "max-width:620px;" +
                        "margin:0 auto;" +
                        "background:#ffffff;" +
                        "border-radius:20px;" +
                        "overflow:hidden;" +
                        "box-shadow:0 10px 35px rgba(0,0,0,0.08);" +
                        "\">" +

                        /*
                         * HEADER
                         */

                        "<div style=\"" +
                        "padding:30px 34px;" +
                        "border-bottom:1px solid #eeeeee;" +
                        "text-align:center;" +
                        "\">" +

                        "<img " +
                        "src=\"cid:trt-logo\" " +
                        "alt=\"TRT\" " +
                        "style=\"" +
                        "width:75px;" +
                        "height:auto;" +
                        "display:block;" +
                        "margin:0 auto 15px auto;" +
                        "\">" +

                        "<div style=\"" +
                        "font-size:13px;" +
                        "font-weight:700;" +
                        "letter-spacing:1.2px;" +
                        "color:#111111;" +
                        "\">" +

                        "BROADCAST INCIDENT MANAGEMENT" +

                        "</div>" +

                        "</div>" +

                        /*
                         * CONTENT
                         */

                        "<div style=\"" +
                        "padding:36px 38px;" +
                        "\">" +

                        "<div style=\"" +
                        "font-size:11px;" +
                        "font-weight:700;" +
                        "letter-spacing:1px;" +
                        "color:#d40000;" +
                        "text-transform:uppercase;" +
                        "margin-bottom:10px;" +
                        "\">" +

                        "YENİ OLAY ATAMASI" +

                        "</div>" +

                        "<h1 style=\"" +
                        "margin:0 0 12px 0;" +
                        "font-size:28px;" +
                        "line-height:1.2;" +
                        "letter-spacing:-0.5px;" +
                        "color:#111111;" +
                        "\">" +

                        "Merhaba " +
                        escapeHtml(technicianUsername) +
                        "," +

                        "</h1>" +

                        "<p style=\"" +
                        "margin:0 0 28px 0;" +
                        "font-size:15px;" +
                        "line-height:1.7;" +
                        "color:#6b7280;" +
                        "\">" +

                        "Size yeni bir teknik olay atanmıştır. " +
                        "Aşağıdaki bilgileri inceleyerek gerekli " +
                        "işlemleri başlatabilirsiniz." +

                        "</p>" +

                        /*
                         * INCIDENT CARD
                         */

                        "<div style=\"" +
                        "border:1px solid #e5e7eb;" +
                        "border-radius:16px;" +
                        "overflow:hidden;" +
                        "margin-bottom:25px;" +
                        "\">" +

                        "<div style=\"" +
                        "padding:20px 22px;" +
                        "background:#fafafa;" +
                        "border-bottom:1px solid #eeeeee;" +
                        "\">" +

                        "<div style=\"" +
                        "font-size:11px;" +
                        "color:#9ca3af;" +
                        "font-weight:700;" +
                        "letter-spacing:0.8px;" +
                        "margin-bottom:8px;" +
                        "\">" +

                        "OLAY #" +
                        incident.getId() +

                        "</div>" +

                        "<div style=\"" +
                        "font-size:18px;" +
                        "line-height:1.4;" +
                        "font-weight:700;" +
                        "color:#111111;" +
                        "\">" +

                        escapeHtml(
                                incident.getTitle()
                        ) +

                        "</div>" +

                        "</div>" +

                        /*
                         * BADGES
                         */

                        "<div style=\"" +
                        "padding:18px 22px;" +
                        "border-bottom:1px solid #eeeeee;" +
                        "\">" +

                        "<span style=\"" +
                        "display:inline-block;" +
                        "background:" +
                        statusColor +
                        ";" +
                        "color:#ffffff;" +
                        "padding:7px 11px;" +
                        "border-radius:999px;" +
                        "font-size:11px;" +
                        "font-weight:700;" +
                        "margin-right:6px;" +
                        "\">" +

                        statusLabel +

                        "</span>" +

                        "<span style=\"" +
                        "display:inline-block;" +
                        "background:" +
                        priorityColor +
                        ";" +
                        "color:#ffffff;" +
                        "padding:7px 11px;" +
                        "border-radius:999px;" +
                        "font-size:11px;" +
                        "font-weight:700;" +
                        "\">" +

                        priorityLabel +

                        "</span>" +

                        "</div>" +

                        /*
                         * DETAILS
                         */

                        "<div style=\"" +
                        "padding:20px 22px;" +
                        "\">" +

                        "<table width=\"100%\" " +
                        "cellpadding=\"0\" " +
                        "cellspacing=\"0\" " +
                        "border=\"0\" " +
                        "style=\"font-size:13px;\">" +

                        "<tr>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#9ca3af;" +
                        "width=\"40%;\">" +

                        "Oluşturan" +

                        "</td>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#111111;" +
                        "font-weight:600;" +
                        "\">" +

                        escapeHtml(createdBy) +

                        "</td>" +

                        "</tr>" +

                        "<tr>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#9ca3af;" +
                        "\">" +

                        "Atanan teknisyen" +

                        "</td>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#111111;" +
                        "font-weight:600;" +
                        "\">" +

                        escapeHtml(assignedTo) +

                        "</td>" +

                        "</tr>" +

                        "<tr>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#9ca3af;" +
                        "\">" +

                        "Oluşturulma" +

                        "</td>" +

                        "<td style=\"" +
                        "padding:7px 0;" +
                        "color:#111111;" +
                        "font-weight:600;" +
                        "\">" +

                        createdAt +

                        "</td>" +

                        "</tr>" +

                        "</table>" +

                        "</div>" +

                        "</div>" +

                        /*
                         * DESCRIPTION
                         */

                        "<div style=\"" +
                        "margin-bottom:28px;" +
                        "\">" +

                        "<div style=\"" +
                        "font-size:12px;" +
                        "font-weight:700;" +
                        "color:#111111;" +
                        "margin-bottom:9px;" +
                        "\">" +

                        "Olay Açıklaması" +

                        "</div>" +

                        "<div style=\"" +
                        "padding:16px 18px;" +
                        "background:#f8f8fa;" +
                        "border-radius:12px;" +
                        "color:#4b5563;" +
                        "font-size:14px;" +
                        "line-height:1.7;" +
                        "\">" +

                        escapeHtml(description)
                                .replace("\n", "<br>") +

                        "</div>" +

                        "</div>" +

                        /*
                         * BUTTON
                         */

                        "<div style=\"" +
                        "text-align:center;" +
                        "margin:30px 0;" +
                        "\">" +

                        "<a href=\"" +
                        incidentUrl +
                        "\" " +
                        "style=\"" +
                        "display:inline-block;" +
                        "background:#d40000;" +
                        "color:#ffffff;" +
                        "text-decoration:none;" +
                        "padding:14px 28px;" +
                        "border-radius:11px;" +
                        "font-size:14px;" +
                        "font-weight:700;" +
                        "\">" +

                        "Olay Detayını Görüntüle →" +

                        "</a>" +

                        "</div>" +

                        /*
                         * NOTICE
                         */

                        "<div style=\"" +
                        "border-top:1px solid #eeeeee;" +
                        "padding-top:20px;" +
                        "color:#9ca3af;" +
                        "font-size:11px;" +
                        "line-height:1.7;" +
                        "\">" +

                        "Bu e-posta TRT Broadcast Incident " +
                        "Management sistemi tarafından otomatik " +
                        "olarak oluşturulmuştur." +

                        "</div>" +

                        "</div>" +

                        /*
                         * FOOTER
                         */

                        "<div style=\"" +
                        "padding:22px;" +
                        "background:#f9fafb;" +
                        "text-align:center;" +
                        "color:#9ca3af;" +
                        "font-size:11px;" +
                        "line-height:1.6;" +
                        "\">" +

                        "TRT Broadcast Incident Management" +

                        "<br><br>" +

                        "© 2026 TRT – Tüm hakları saklıdır." +

                        "</div>" +

                        "</div>" +

                        "</body>" +
                        "</html>";

        helper.setText(
                htmlContent,
                true
        );

        ClassPathResource logo =
                new ClassPathResource(
                        "static/images/trt-logo.png"
                );

        helper.addInline(
                "trt-logo",
                logo,
                "image/png"
        );

        mailSender.send(message);
    }


    /**
     * Öncelik Türkçe karşılığı.
     */
    private String getPriorityLabel(
            Priority priority) {

        if (priority == null) {
            return "Belirtilmedi";
        }

        return switch (priority) {

            case LOW ->
                    "Düşük";

            case MEDIUM ->
                    "Orta";

            case HIGH ->
                    "Yüksek";

            case CRITICAL ->
                    "Kritik";
        };
    }


    private String escapeHtml(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    /**
     * Öncelik için mail badge rengi.
     */
    private String getPriorityColor(
            Priority priority) {

        if (priority == null) {
            return "#6b7280";
        }

        return switch (priority) {

            case LOW ->
                    "#6b7280";

            case MEDIUM ->
                    "#2563eb";

            case HIGH ->
                    "#d97706";

            case CRITICAL ->
                    "#dc2626";
        };
    }


    /**
     * Durum Türkçe karşılığı.
     */
    private String getStatusLabel(
            IncidentStatus status) {

        if (status == null) {
            return "Belirtilmedi";
        }

        return switch (status) {

            case OPEN ->
                    "Açık";

            case INVESTIGATING ->
                    "İnceleniyor";

            case IN_PROGRESS ->
                    "Devam Ediyor";

            case RESOLVED ->
                    "Çözüldü";

            case CLOSED ->
                    "Kapatıldı";
        };
    }


    /**
     * Durum için mail badge rengi.
     */
    private String getStatusColor(
            IncidentStatus status) {

        if (status == null) {
            return "#6b7280";
        }

        return switch (status) {

            case OPEN ->
                    "#d40000";

            case INVESTIGATING ->
                    "#7c3aed";

            case IN_PROGRESS ->
                    "#2563eb";

            case RESOLVED ->
                    "#16834b";

            case CLOSED ->
                    "#6b7280";
        };
    }


    /**
     * SMTP bağlantısını test etmek için kullanılır.
     */
    public void sendTestEmail(
            String email) throws MessagingException {

        MimeMessage message =
                mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(
                        message,
                        true,
                        "UTF-8"
                );

        helper.setTo(email);

        helper.setSubject(
                "TRT Incident Management - SMTP Test"
        );

        String htmlContent = """
                <!DOCTYPE html>
                <html lang="tr">

                <body style="
                    font-family:Arial, Helvetica, sans-serif;
                    background:#f4f6f8;
                    padding:40px;
                ">

                    <div style="
                        max-width:500px;
                        margin:auto;
                        background:white;
                        padding:30px;
                        border-radius:12px;
                    ">

                        <h2 style="color:#111827;">
                            TRT Broadcast Incident Management
                        </h2>

                        <p>
                            SMTP bağlantısı başarıyla çalışıyor. 🎉
                        </p>

                        <p>
                            Bu e-posta Spring Boot uygulaması
                            tarafından otomatik olarak gönderildi.
                        </p>

                        <p style="
                            color:#6b7280;
                            font-size:13px;
                        ">
                            SMTP test mesajıdır.
                        </p>

                    </div>

                </body>

                </html>
                """;

        helper.setText(
                htmlContent,
                true
        );

        mailSender.send(message);
    }
}