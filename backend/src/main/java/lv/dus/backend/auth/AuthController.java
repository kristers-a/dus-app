package lv.dus.backend.auth;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) {
        return Map.of("token",token.getToken(),"headerName",token.getHeaderName());
    }
    @GetMapping("/me") public Map<String,String> me(Authentication auth) {
        return Map.of("username",auth.getName(),"role",auth.getAuthorities().iterator().next()
            .getAuthority().replace("ROLE_", ""));
    }
}
