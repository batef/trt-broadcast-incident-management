package com.trt.broadcastincidentmanagement.service;

import com.trt.broadcastincidentmanagement.dto.*;
import com.trt.broadcastincidentmanagement.entity.Incident;
import com.trt.broadcastincidentmanagement.entity.User;
import com.trt.broadcastincidentmanagement.enums.IncidentStatus;
import com.trt.broadcastincidentmanagement.enums.Role;
import com.trt.broadcastincidentmanagement.repository.IncidentRepository;
import com.trt.broadcastincidentmanagement.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final String UPPER =
            "ABCDEFGHJKLMNPQRSTUVWXYZ";

    private static final String LOWER =
            "abcdefghijkmnopqrstuvwxyz";

    private static final String DIGITS =
            "23456789";

    private static final String ALL =
            UPPER + LOWER + DIGITS;

    private static final SecureRandom RANDOM =
            new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final IncidentRepository incidentRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            IncidentRepository incidentRepository) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.incidentRepository = incidentRepository;
    }

    public CreateUserResponse createUser(CreateUserRequest request) {

        // E-posta daha önce kullanılmış mı?
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException(
                    "Bu e-posta adresi zaten kullanılıyor."
            );
        }

        // Ad + soyaddan otomatik username üret
        String username = generateUsername(
                request.getFirstName(),
                request.getLastName()
        );

        // Geçici şifre üret
        String temporaryPassword =
                generateTemporaryPassword();

        // Kullanıcı oluştur
        User user = new User();

        user.setUsername(username);
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        // DB'ye düz şifre ASLA kaydedilmiyor
        user.setPassword(
                passwordEncoder.encode(temporaryPassword)
        );

        // İlk girişte şifre değiştirmek zorunda
        user.setMustChangePassword(true);

        User saved = userRepository.save(user);

        // Kullanıcıya hoş geldin maili gönder
        try {

            String fullName =
                    request.getFirstName().trim()
                            + " "
                            + request.getLastName().trim();

            emailService.sendWelcomeEmail(
                    saved.getEmail(),
                    fullName,
                    saved.getUsername(),
                    temporaryPassword
            );

        } catch (Exception e) {

            // Mail gönderilemezse kullanıcıyı DB'de
            // bırakmak istemiyoruz.
            userRepository.delete(saved);

            throw new RuntimeException(
                    "Kullanıcı oluşturuldu ancak e-posta gönderilemedi.",
                    e
            );
        }

        return new CreateUserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getRole(),
                temporaryPassword
        );
    }

    /**
     * Ad + soyaddan username oluşturur.
     *
     * Örnek:
     * Mehmet Yılmaz
     *       ↓
     * mehmet.yilmaz
     */
    private String generateUsername(
            String firstName,
            String lastName) {

        String first =
                normalizeUsernamePart(firstName);

        String last =
                normalizeUsernamePart(lastName);

        String baseUsername =
                first + "." + last;

        String username = baseUsername;

        int counter = 2;

        while (userRepository.findByUsername(username).isPresent()) {

            username = baseUsername + counter;

            counter++;
        }

        return username;
    }

    /**
     * Username için Türkçe karakterleri temizler.
     */
    private String normalizeUsernamePart(String value) {

        String normalized =
                Normalizer.normalize(
                        value.trim().toLowerCase(),
                        Normalizer.Form.NFD
                );

        return normalized
                .replaceAll("\\p{M}", "")
                .replace("ı", "i")
                .replace("ğ", "g")
                .replace("ü", "u")
                .replace("ş", "s")
                .replace("ö", "o")
                .replace("ç", "c")
                .replaceAll("[^a-z0-9]", "");
    }

    /**
     * Rastgele geçici şifre üretir.
     */
    private String generateTemporaryPassword() {

        StringBuilder first =
                new StringBuilder();

        StringBuilder second =
                new StringBuilder();

        for (int i = 0; i < 5; i++) {

            first.append(
                    ALL.charAt(
                            RANDOM.nextInt(ALL.length())
                    )
            );
        }

        for (int i = 0; i < 5; i++) {

            second.append(
                    ALL.charAt(
                            RANDOM.nextInt(ALL.length())
                    )
            );
        }

        // Büyük harf garanti
        first.setCharAt(
                0,
                UPPER.charAt(
                        RANDOM.nextInt(UPPER.length())
                )
        );

        // Rakam garanti
        second.setCharAt(
                second.length() - 1,
                DIGITS.charAt(
                        RANDOM.nextInt(DIGITS.length())
                )
        );

        return first + "-" + second;
    }

    public UserSummaryResponse getUserSummary(Long id) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Bu ID ile kayıtlı kullanıcı bulunamadı."
                                )
                        );

        return createUserSummary(user);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<UserSummaryResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::createUserSummary)
                .toList();
    }

    /**
     * Sadece teknisyenleri döndürür.
     *
     * GET /api/users/technicians
     */
    public List<UserSummaryResponse> getTechnicians() {

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRole() == Role.TECHNICIAN
                )
                .map(this::createUserSummary)
                .toList();
    }
    /**
     * Mesajlaşma ekranında kullanılacak kullanıcı listesi.
     *
     * Giriş yapan kullanıcı hariç tüm kullanıcıları döndürür.
     */
    public List<UserSummaryResponse> getMessagingUsers() {

        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        !user.getId().equals(currentUser.getId())
                )
                .map(this::createUserSummary)
                .toList();
    }
    /**
     * Kullanıcının oluşturduğu ve kendisine atanmış
     * olayları getirir.
     */
    public UserDetailsResponse getUserDetails(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Bu ID ile kayıtlı kullanıcı bulunamadı."
                        )
                );

        List<IncidentResponse> createdIncidents =
                incidentRepository.findByCreatedById(id)
                        .stream()
                        .map(this::convertIncidentToResponse)
                        .toList();

        List<IncidentResponse> assignedIncidents =
                incidentRepository.findByAssignedToId(id)
                        .stream()
                        .map(this::convertIncidentToResponse)
                        .toList();

        return new UserDetailsResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                createdIncidents,
                assignedIncidents
        );
    }

    /**
     * Kullanıcı özetini oluşturur.
     *
     * Aktif olay:
     * OPEN
     * veya
     * IN_PROGRESS
     *
     * Bu olaylardan biri teknisyene atanmışsa
     * teknisyen meşgul kabul edilir.
     */
    private UserSummaryResponse createUserSummary(User user) {

        int activeIncidentCount = 0;

        if (user.getRole() == Role.TECHNICIAN) {

            activeIncidentCount =
                    (int) incidentRepository
                            .findByAssignedToId(user.getId())
                            .stream()
                            .filter(this::isActiveIncident)
                            .count();
        }

        boolean available =
                user.getRole() == Role.TECHNICIAN
                        && activeIncidentCount == 0;

        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                available,
                activeIncidentCount
        );
    }

    /**
     * Teknisyenin aktif kabul edilmesine neden olan
     * olay durumları.
     */
    private boolean isActiveIncident(Incident incident) {

        return incident.getStatus() == IncidentStatus.OPEN
                || incident.getStatus() == IncidentStatus.IN_PROGRESS;
    }

    private IncidentResponse convertIncidentToResponse(
            Incident incident) {

        String createdByUsername =
                incident.getCreatedBy() != null
                        ? incident.getCreatedBy().getUsername()
                        : null;

        String assignedToUsername =
                incident.getAssignedTo() != null
                        ? incident.getAssignedTo().getUsername()
                        : null;

        return new IncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getPriority(),
                incident.getStatus(),
                incident.getCreatedAt(),
                createdByUsername,
                assignedToUsername
        );
    }
}