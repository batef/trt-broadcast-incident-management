package com.trt.broadcastincidentmanagement.service;

import com.trt.broadcastincidentmanagement.dto.CreateUserRequest;
import com.trt.broadcastincidentmanagement.dto.CreateUserResponse;
import com.trt.broadcastincidentmanagement.dto.UserSummaryResponse;
import com.trt.broadcastincidentmanagement.entity.User;
import com.trt.broadcastincidentmanagement.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class UserService {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String ALL = UPPER + LOWER + DIGITS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ADMIN tarafından yeni kullanıcı oluşturma. Kalıcı şifre admin
    // tarafından belirlenmez; backend rastgele, tek kullanımlık bir
    // geçici şifre üretir ve yalnızca bu cevapta düz metin olarak döner.
    public CreateUserResponse createUser(CreateUserRequest request) {

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Bu kullanıcı adı zaten kullanılıyor.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Bu e-posta adresi zaten kullanılıyor.");
        }

        String temporaryPassword = generateTemporaryPassword();

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);

        User saved = userRepository.save(user);

        return new CreateUserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getRole(),
                temporaryPassword
        );
    }

    // Olay atama ekranında girilen kullanıcı ID'sinin gerçek bir
    // kullanıcıya karşılık gelip gelmediğini doğrulamak için kullanılır.
    public UserSummaryResponse getUserSummary(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bu ID ile kayıtlı kullanıcı bulunamadı."));

        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    // Örnek çıktı: "X7kP-92LmQ" — tahmin edilemez, yeterince uzun,
    // yalnızca ilk giriş için kullanılan tek kullanımlık bir şifre.
    private String generateTemporaryPassword() {
        StringBuilder first = new StringBuilder();
        StringBuilder second = new StringBuilder();

        for (int i = 0; i < 5; i++) {
            first.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }
        for (int i = 0; i < 5; i++) {
            second.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }

        // Her iki parçada da en az bir büyük harf ve bir rakam garanti edilir.
        first.setCharAt(0, UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        second.setCharAt(second.length() - 1, DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));

        return first + "-" + second;
    }
}
