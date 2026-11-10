package lv.dus.backend.config;
import lv.dus.backend.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
@Profile("local")
public class LocalSeed {
    @Bean CommandLineRunner seed(UserRepository users, PasswordEncoder encoder,
        MongoTemplate mongo,
        @Value("${DEMO_ADMIN_PASSWORD:}") String adminPassword,
        @Value("${DEMO_MODERATOR_PASSWORD:}") String moderatorPassword,
        @Value("${DEMO_USER_PASSWORD:}") String userPassword) {
        return args -> {
            mongo.indexOps(AppUser.class).ensureIndex(new Index().on("username", Sort.Direction.ASC).unique());
            create(users, encoder, "admin", adminPassword, "ADMIN");
            create(users, encoder, "moderator", moderatorPassword, "MODERATOR");
            create(users, encoder, "user", userPassword, "USER");
        };
    }

    private static void create(UserRepository users, PasswordEncoder encoder,
                            String username, String password, String role) {
        if (users.findByUsername(username).isPresent()) return;
        if (password.length() < 12 || password.length() > 64)
            throw new IllegalStateException("Iestati paroli (.env) lietotājam " + username + ": 12–64 rakstzīmes");
        users.save(new AppUser(null, username, encoder.encode(password), role, true));
    }
}
