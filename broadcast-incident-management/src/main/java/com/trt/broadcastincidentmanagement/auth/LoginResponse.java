package com.trt.broadcastincidentmanagement.auth;

import com.trt.broadcastincidentmanagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private Role role;

    // Kullanıcı geçici şifreyle giriş yaptıysa true; frontend bu durumda
    // kullanıcıyı /change-password'a zorunlu yönlendirmelidir.
    private boolean mustChangePassword;
}
