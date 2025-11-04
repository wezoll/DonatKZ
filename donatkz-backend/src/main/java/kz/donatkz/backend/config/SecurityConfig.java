package kz.donatkz.backend.config;

import kz.donatkz.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // ✅ Включаем @PreAuthorize поддержку
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Публичные endpoints (без JWT)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/device/pair").permitAll() // Desktop App привязка
                        .requestMatchers("/api/device/check-status").permitAll() // Frontend polling

                        // WebSocket endpoints (ВАЖНО для real-time донатов!)
                        .requestMatchers("/ws/**").permitAll() // WebSocket connection endpoint
                        .requestMatchers("/topic/**").permitAll() // WebSocket topics
                        .requestMatchers("/app/**").permitAll() // WebSocket app destinations

                        // Публичные endpoints для OBS виджетов (используют API ключ в URL)
                        .requestMatchers("/api/goals/widget/**").permitAll() // Виджет цели
                        .requestMatchers("/api/statistics-widgets/display/**").permitAll() // Виджет статистики

                        // Публичные новости и FAQ (GET только)
                        .requestMatchers("/api/news").permitAll()
                        .requestMatchers("/api/news/**").permitAll()
                        .requestMatchers("/api/faq").permitAll()
                        .requestMatchers("/api/faq/**").permitAll()

                        // Все остальные endpoints требуют JWT
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}