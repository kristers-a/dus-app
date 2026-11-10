package lv.dus.backend.data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
public record DemoData(List<String> info, List<Source> sources, Map<String,Integer> estimateOffsetsCents,
                       List<StationEntry> stations, List<Observation> observations) {
    public record Source(String chain, String label, String updatedAt, String url, String note) {}
    public record StationEntry(String id, String name, String chain, String stationType, String address,
                               Double latitude, Double longitude, String description, List<String> fuels) {}
    public record Observation(String stationId, String chain, String fuel, BigDecimal price, Boolean networkWide,
                              String effectiveDate, String fetchedAt, String sourceUrl) {
        public boolean isNetworkWide() { return Boolean.TRUE.equals(networkWide); }
    }
}
