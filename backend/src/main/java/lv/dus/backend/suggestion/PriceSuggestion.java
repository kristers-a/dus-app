package lv.dus.backend.suggestion;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("priceSuggestions")
public record PriceSuggestion(@Id String id, String stationId, String fuelType,
    String proposedPrice, String submittedBy, Instant submittedAt, String status,
    String reviewedBy, Instant reviewedAt, String rejectionReason) {}
