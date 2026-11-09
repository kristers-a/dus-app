package lv.dus.backend.user;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface UserRepository extends MongoRepository<AppUser,String> {
    Optional<AppUser> findByUsername(String username);
}
