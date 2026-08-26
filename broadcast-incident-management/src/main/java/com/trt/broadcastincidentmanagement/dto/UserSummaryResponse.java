package com.trt.broadcastincidentmanagement.dto;

import com.trt.broadcastincidentmanagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

// Olay atama ekranında girilen kullanıcı ID'sinin gerçek kullanıcıya
// karşılık gelip gelmediğini göstermek için kullanılan hafif özet.
@Getter
@AllArgsConstructor
public class UserSummaryResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
}
