package lv.dus.backend.suggestion;
import jakarta.validation.constraints.NotBlank;
public record PriceRequest(@NotBlank String stationId, @NotBlank String fuelType,
                           @NotBlank String price) {}
