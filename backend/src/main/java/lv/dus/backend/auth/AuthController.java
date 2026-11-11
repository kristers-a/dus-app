package lv.dus.backend.auth;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lv.dus.backend.user.AppUser;
import lv.dus.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    public AuthController(UserRepository users, PasswordEncoder encoder) { this.users=users; this.encoder=encoder; }
    public record RegisterRequest(@NotBlank @Size(min=3,max=40) String username,
                                  @NotBlank @Size(min=12,max=64) String password) {}
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) {
        return Map.of("token",token.getToken(),"headerName",token.getHeaderName());
    }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,String> register(@Valid @RequestBody RegisterRequest r) {
        String username=r.username().trim();
        if(username.length()<3) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Lietotājvārds: 3–40 rakstzīmes");
        if(users.findByUsername(username).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Lietotājvārds jau eksistē");
        users.save(new AppUser(null,username,encoder.encode(r.password()),"USER",true));
        return Map.of("username",username,"role","USER");
    }
    @GetMapping("/me") public Map<String,String> me(Authentication auth) {
        return Map.of("username",auth.getName(),"role",auth.getAuthorities().iterator().next()
            .getAuthority().replace("ROLE_", ""));
    }
}
