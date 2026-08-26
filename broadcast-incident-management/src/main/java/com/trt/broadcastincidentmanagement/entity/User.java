package com.trt.broadcastincidentmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.trt.broadcastincidentmanagement.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Admin tarafından geçici şifreyle oluşturulan kullanıcılar ilk girişte
    // yeni bir şifre belirlemek zorunda. Kullanıcı kendi şifresini
    // belirlediğinde bu alan false'a çekilir.
    @Column(nullable = false)
    private boolean mustChangePassword = false;
}
