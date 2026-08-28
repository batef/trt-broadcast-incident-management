package com.trt.broadcastincidentmanagement.controller;

import com.trt.broadcastincidentmanagement.dto.CreateUserRequest;
import com.trt.broadcastincidentmanagement.dto.CreateUserResponse;
import com.trt.broadcastincidentmanagement.dto.UserDetailsResponse;
import com.trt.broadcastincidentmanagement.dto.UserSummaryResponse;
import com.trt.broadcastincidentmanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Yalnızca ADMIN — bkz. SecurityConfig. Yetkisiz istek 403 döner.
    @PostMapping
    public CreateUserResponse createUser(
            @Valid @RequestBody CreateUserRequest request) {

        return userService.createUser(request);
    }

    // Olay atama ekranında girilen ID'nin gerçek kullanıcıya karşılık
    // gelip gelmediğini göstermek için. Yalnızca ADMIN/SUPERVISOR —
    // bkz. SecurityConfig.
    @GetMapping("/{id}")
    public ResponseEntity<UserSummaryResponse> getUserById(@PathVariable Long id) {
        return userService.findById(id).isPresent()
                ? ResponseEntity.ok(userService.getUserSummary(id))
                : ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<UserSummaryResponse>> getTechnicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    @GetMapping("/messaging")
    public ResponseEntity<List<UserSummaryResponse>> getMessagingUsers() {
        return ResponseEntity.ok(
                userService.getMessagingUsers()
        );
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<UserDetailsResponse> getUserDetails(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.getUserDetails(id)
        );
    }
}
