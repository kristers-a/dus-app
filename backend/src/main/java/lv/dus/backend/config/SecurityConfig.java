package lv.dus.backend.config;
import lv.dus.backend.user.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean UserDetailsService userDetailsService(UserRepository users) {
        return username -> users.findByUsername(username)
            .map(u -> User.withUsername(u.username()).password(u.passwordHash())
                .roles(u.role()).disabled(!u.enabled()).build())
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
    @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
        http.csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/csrf", "/api/auth/login", "/error").permitAll()
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/moderation/**").hasAnyRole("ADMIN", "MODERATOR")
                .anyRequest().authenticated())
            .formLogin(f -> f.loginProcessingUrl("/api/auth/login")
                .successHandler((req,res,auth) -> res.setStatus(204))
                .failureHandler((req,res,e) -> res.sendError(401, "Invalid credentials")))
            .logout(l -> l.logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((req,res,auth) -> res.setStatus(204)))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req,res,ex) -> res.sendError(401))
                .accessDeniedHandler((req,res,ex) -> res.sendError(403)));
        return http.build();
    }
}
