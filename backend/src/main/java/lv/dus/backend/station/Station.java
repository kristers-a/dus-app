package lv.dus.backend.station;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("stations")
public record Station(@Id String id, String name, String address, double latitude,
                      double longitude, String description, List<FuelPrice> fuelPrices,
                      String chain, String stationType, Boolean demo, List<String> fuels,
                      List<HistoryPoint> priceHistory) {
    public static final List<String> FUELS = List.of("PETROL_95","PETROL_98","DIESEL","LPG");
    public record FuelPrice(String fuelType, String price, String updatedAt, String kind,
                            String source, String sourceUrl, String effectiveDate) {}
    public record HistoryPoint(String fuelType, String price, String date) {}
    public Station withPrices(List<FuelPrice> prices, List<HistoryPoint> history) {
        return new Station(id,name,address,latitude,longitude,description,prices,chain,stationType,demo,fuels,history);
    }
}
