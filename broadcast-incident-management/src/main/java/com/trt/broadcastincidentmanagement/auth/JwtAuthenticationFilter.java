package com.trt.broadcastincidentmanagement.auth;

import com.trt.broadcastincidentmanagement.entity.User;
import com.trt.broadcastincidentmanagement.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Authorization header yoksa devam et
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(token);

            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                User user = userRepository.findByUsername(username)
                        .orElse(null);

                if (user != null &&
                        jwtService.isTokenValid(token, username)) {

                    // Kullanıcı geçici şifreyle giriş yapıp henüz yeni şifre
                    // belirlemediyse, /api/auth/** dışındaki hiçbir endpoint'e
                    // erişemez. Bu, frontend'deki /change-password yönlendirmesinin
                    // arkasındaki asıl güvenlik katmanıdır.
                    String path = request.getRequestURI();
                    if (user.isMustChangePassword() && !path.startsWith("/api/auth")) {
                        response.sendError(
                                HttpServletResponse.SC_FORBIDDEN,
                                "Password change required"
                        );
                        return;
                    }

                    SimpleGrantedAuthority authority =
                            new SimpleGrantedAuthority(
                                    "ROLE_" + user.getRole().name()
                            );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    List.of(authority)
                            );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);
                }
            }

        } catch (Exception e) {
            // Geçersiz token varsa authentication oluşturma.
            // İstek Security tarafından reddedilecek.
        }

        filterChain.doFilter(request, response);
    }
}