package com.trt.broadcastincidentmanagement.controller;

import com.trt.broadcastincidentmanagement.dto.CreateUserRequest;
import com.trt.broadcastincidentmanagement.dto.CreateUserResponse;
import com.trt.broadcastincidentmanagement.dto.UserSummaryResponse;
import com.trt.broadcastincidentmanagement.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Yalnızca ADMIN — bkz. SecurityConfig. Yetkisiz istek 403 döner.
    @PostMapping
    public CreateUserResponse createUser(@RequestBody CreateUserRequest request) {
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
}
