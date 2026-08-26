package com.trt.broadcastincidentmanagement.dto;

import com.trt.broadcastincidentmanagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

// Kullanıcı oluşturulduktan hemen sonra dönen cevap.
// temporaryPassword yalnızca BU cevapta, bir kez gösterilir;
// düz metin olarak hiçbir yerde saklanmaz.
@Getter
@AllArgsConstructor
public class CreateUserResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private String temporaryPassword;
}
