package lv.dus.backend.station;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
class PriceEstimatorTest {
    private static Station station(String id, String chain, String type, List<String> fuels, Station.FuelPrice... prices) {
        return new Station(id, id, "", 56.9, 24.1, "", List.of(prices), chain, type, true, fuels, List.of());
    }
    private static Station.FuelPrice listed(String fuel, String price) {
        return new Station.FuelPrice(fuel, price, "2026-11-10", "listed", "test", null, "2026-11-10");
    }
    private static Station.FuelPrice price(List<Station> result, String id, String fuel) {
        return result.stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow()
            .fuelPrices().stream().filter(p -> p.fuelType().equals(fuel)).findFirst().orElse(null);
    }
    @Test void usesGroupThenChainThenMarket() {
        var result = PriceEstimator.withEstimates(List.of(
            station("a", "circlek", "staffed", List.of("PETROL_95"), listed("PETROL_95", "1.700")),
            station("b", "circlek", "staffed", List.of("PETROL_95"), listed("PETROL_95", "1.800")),
            station("c", "circlek", "automated", List.of("PETROL_95"), listed("PETROL_95", "1.600")),
            station("d", "circlek", "staffed", List.of("PETROL_95")),
            station("e", "circlek", "unknown", List.of("PETROL_95")),
            station("f", "neste", "staffed", List.of("PETROL_95"))), Map.of());
        assertEquals("listed", price(result, "a", "PETROL_95").kind());
        assertEquals("estimated_group", price(result, "d", "PETROL_95").kind());
        assertEquals("1.750", price(result, "d", "PETROL_95").price());
        assertEquals("estimated_chain", price(result, "e", "PETROL_95").kind());
        assertEquals("1.700", price(result, "e", "PETROL_95").price());
        assertEquals("estimated_market", price(result, "f", "PETROL_95").kind());
        assertEquals("1.700", price(result, "f", "PETROL_95").price());
    }
    @Test void appliesChainOffsetAndSkipsFuelsNotSold() {
        var result = PriceEstimator.withEstimates(List.of(
            station("a", "virsi", "staffed", List.of("DIESEL"), listed("DIESEL", "2.000")),
            station("b", "neste", "staffed", List.of("DIESEL"))), Map.of("neste", 5));
        assertEquals("2.050", price(result, "b", "DIESEL").price());
        assertNull(price(result, "b", "LPG"));
    }
    @Test void noBasisMeansNoEstimate() {
        var result = PriceEstimator.withEstimates(List.of(station("a", "kool", "staffed", List.of("LPG"))), Map.of());
        assertNull(price(result, "a", "LPG"));
    }
}
