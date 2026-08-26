package com.trt.broadcastincidentmanagement.dto;

import com.trt.broadcastincidentmanagement.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Admin'in yeni kullanıcı oluştururken gönderdiği alanlar.
// Kasıtlı olarak şifre alanı YOK: şifreyi backend üretir.
@Getter
@Setter
public class CreateUserRequest {

    @NotBlank(message = "Username cannot be empty")
    private String username;

    @NotBlank(message = "Email cannot be empty")
    private String email;

    @NotNull(message = "Role is required")
    private Role role;
}
