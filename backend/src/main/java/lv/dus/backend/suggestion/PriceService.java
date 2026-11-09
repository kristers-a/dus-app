package lv.dus.backend.suggestion;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Set;
import lv.dus.backend.station.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@Service
public class PriceService {
    private final StationRepository stations;
    public PriceService(StationRepository stations) { this.stations = stations; }
    public Station station(String id) {
        return stations.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Stacija neeksistē"));
    }
    public String validate(PriceRequest request) {
        Station s = station(request.stationId());
        if (!Set.of("PETROL_95","PETROL_98","DIESEL","LPG").contains(request.fuelType()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Neatbalstīts degvielas veids");
        try {
            BigDecimal price = new BigDecimal(request.price());
            if (price.signum() <= 0 || price.compareTo(new BigDecimal("10")) > 0 || price.scale() > 3)
                throw new IllegalArgumentException();
            if (s.fuelPrices().stream().noneMatch(p -> p.fuelType().equals(request.fuelType())))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Stacijā šis degvielas veids nav pieejams");
            return price.setScale(3,RoundingMode.UNNECESSARY).toPlainString();
        } catch (IllegalArgumentException | ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Cena: 0 < cena ≤ 10 EUR/L, līdz 3 zīmēm aiz komata");
        }
    }
    public void update(PriceRequest request) {
        String normalized = validate(request);
        Station s = station(request.stationId());
        var prices = new ArrayList<>(s.fuelPrices());
        prices.removeIf(p -> p.fuelType().equals(request.fuelType()));
        prices.add(new Station.FuelPrice(request.fuelType(), normalized, Instant.now().toString()));
        stations.save(new Station(s.id(),s.name(),s.address(),s.latitude(),s.longitude(),s.description(),prices));
    }
}
