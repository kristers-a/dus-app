package lv.dus.backend.station;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface StationRepository extends MongoRepository<Station,String> {}
