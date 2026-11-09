package lv.dus.backend.station;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("stations")
public record Station(@Id String id, String name, String address, double latitude,
                      double longitude, String description, List<FuelPrice> fuelPrices) {
    public record FuelPrice(String fuelType, String price, String updatedAt) {}
}
