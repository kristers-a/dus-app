package lv.dus.backend.config;
import java.time.Instant;
import java.util.List;
import lv.dus.backend.station.*;
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
    @Bean CommandLineRunner seed(UserRepository users, StationRepository stations, PasswordEncoder encoder,
        MongoTemplate mongo, @Value("${DEMO_ADMIN_PASSWORD:}") String password) {
        return args -> {
            mongo.indexOps(AppUser.class).ensureIndex(new Index().on("username",Sort.Direction.ASC).unique());
            if(users.findByUsername("admin").isEmpty()) {
                if(password.length()<12 || password.length()>64)
                    throw new IllegalStateException("Iestati DEMO_ADMIN_PASSWORD (.env): 12–64 rakstzīmes");
                users.save(new AppUser(null,"admin",encoder.encode(password),"ADMIN",true));
            }
            if(stations.count()==0) {
                String time=Instant.now().toString();
                var prices=List.of(new Station.FuelPrice("PETROL_95","1.654",time),
                    new Station.FuelPrice("DIESEL","1.594",time),new Station.FuelPrice("LPG","0.749",time));
                stations.saveAll(List.of(
                    new Station(null,"DEMO Centrs","Rīgas centrs — demo",56.9496,24.1052,"Izdomāta DUS un demonstrācijas cenas. Nav reāla DUS informācija.",prices),
                    new Station(null,"DEMO Pārdaugava","Pārdaugava — demo",56.9400,24.0690,"Izdomāta DUS un demonstrācijas cenas. Nav reāla DUS informācija.",prices),
                    new Station(null,"DEMO Teika","Teika — demo",56.9740,24.1670,"Izdomāta DUS un demonstrācijas cenas. Nav reāla DUS informācija.",prices)));
            }
        };
    }
}
