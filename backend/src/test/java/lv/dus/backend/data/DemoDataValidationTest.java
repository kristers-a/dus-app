package lv.dus.backend.data;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
class DemoDataValidationTest {
    @Test void shippedDataFileIsValid() throws Exception {
        var data = JsonMapper.builder().build().readValue(Files.readAllBytes(Path.of("data/stations.json")), DemoData.class);
        assertDoesNotThrow(() -> DemoDataService.validate(data));
    }
    @Test void rejectsImplausiblePrice() {
        var station = new DemoData.StationEntry("s1", "S", "virsi", "staffed", "Iela 1", 56.9, 24.1, null, List.of("LPG"));
        var obs = new DemoData.Observation("s1", null, "LPG", new BigDecimal("2.5"), null, "2026-11-10", null, null);
        var data = new DemoData(null, null, null, List.of(station), List.of(obs));
        var e = assertThrows(IllegalArgumentException.class, () -> DemoDataService.validate(data));
        assertTrue(e.getMessage().contains("ārpus"));
    }
    @Test void rejectsUnknownStation() {
        var station = new DemoData.StationEntry("s1", "S", "virsi", "staffed", "Iela 1", 56.9, 24.1, null, List.of("DIESEL"));
        var obs = new DemoData.Observation("nope", null, "DIESEL", new BigDecimal("1.9"), null, "2026-11-10", null, null);
        assertThrows(IllegalArgumentException.class,
            () -> DemoDataService.validate(new DemoData(null, null, null, List.of(station), List.of(obs))));
    }
}
