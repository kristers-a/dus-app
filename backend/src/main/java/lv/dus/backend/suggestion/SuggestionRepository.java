package lv.dus.backend.suggestion;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface SuggestionRepository extends MongoRepository<PriceSuggestion,String> {
    List<PriceSuggestion> findByStatusOrderBySubmittedAtAsc(String status);
}
