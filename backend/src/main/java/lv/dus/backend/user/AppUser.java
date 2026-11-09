package lv.dus.backend.user;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("users")
public record AppUser(@Id String id, String username, String passwordHash, String role, boolean enabled) {}
