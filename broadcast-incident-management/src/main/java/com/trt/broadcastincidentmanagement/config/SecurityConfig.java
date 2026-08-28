package com.trt.broadcastincidentmanagement.config;

import com.trt.broadcastincidentmanagement.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                // CORS aktif
                .cors(Customizer.withDefaults())

                .authorizeHttpRequests(auth -> auth

                        // Login
                        .requestMatchers("/api/auth/**").permitAll()

                        // SMTP test
                        .requestMatchers("/api/test/**").permitAll()

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Kullanıcı oluşturma → sadece ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/users")
                        .hasRole("ADMIN")

                        // Mesajlaşma kullanıcı listesi → giriş yapmış tüm kullanıcılar
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/messaging"
                        )
                        .authenticated()
                        
                        // Kullanıcı sorgulama (olay atama akışı için) → ADMIN/SUPERVISOR
                        .requestMatchers(HttpMethod.GET, "/api/users/*")
                        .hasAnyRole("ADMIN", "SUPERVISOR")

                        .requestMatchers(HttpMethod.GET, "/api/users")
                        .hasAnyRole("ADMIN", "SUPERVISOR")

                        // DELETE → sadece ADMIN
                        .requestMatchers(HttpMethod.DELETE, "/api/incidents/**")
                        .hasRole("ADMIN")

                        // Incident atama
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/incidents/*/assign/*"
                        )
                        .hasAnyRole("ADMIN", "SUPERVISOR")

                        // Incident güncelleme
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/incidents/*"
                        )
                        .hasAnyRole("ADMIN", "SUPERVISOR")

                        // Diğer tüm endpointler JWT ister
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // CORS ayarları
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:3000",
                        "http://localhost:3001"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}