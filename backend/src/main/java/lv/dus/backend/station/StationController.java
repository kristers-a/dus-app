package lv.dus.backend.station;
import java.util.List;
import lv.dus.backend.data.DemoData;
import lv.dus.backend.data.DemoDataService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@RestController
@RequestMapping("/api/stations")
public class StationController {
    private final StationRepository stations;
    private final DemoDataService data;
    public StationController(StationRepository stations, DemoDataService data) { this.stations = stations; this.data = data; }
    @GetMapping public List<Station> all() {
        data.refresh();
        return PriceEstimator.withEstimates(stations.findAll(), data.offsetsCents());
    }
    @GetMapping("/sources") public List<DemoData.Source> sources() { data.refresh(); return data.sources(); }
    @GetMapping("/{id}") public Station one(@PathVariable String id) {
        return all().stream().filter(s -> s.id().equals(id)).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
