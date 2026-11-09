package lv.dus.backend.user;
import java.util.List;
import java.util.Set;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    public UserController(UserRepository users,PasswordEncoder encoder) {this.users=users;this.encoder=encoder;}
    public record UserView(String id,String username,String role,boolean enabled) {}
    public record CreateUser(@NotBlank @Size(min=3,max=40) String username,
        @NotBlank @Size(min=12,max=64) String password, @NotBlank String role) {}
    @GetMapping public List<UserView> all() {
        return users.findAll().stream().map(u -> new UserView(u.id(),u.username(),u.role(),u.enabled())).toList();
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public UserView create(@Valid @RequestBody CreateUser r) {
        if(!Set.of("USER","MODERATOR","ADMIN").contains(r.role()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nederīga loma");
        AppUser u=users.save(new AppUser(null,r.username().trim(),encoder.encode(r.password()),r.role(),true));
        return new UserView(u.id(),u.username(),u.role(),u.enabled());
    }
}
