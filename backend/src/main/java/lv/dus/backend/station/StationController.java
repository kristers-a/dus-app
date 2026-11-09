package lv.dus.backend.station;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@RestController
@RequestMapping("/api/stations")
public class StationController {
    private final StationRepository stations;
    public StationController(StationRepository stations) { this.stations = stations; }
    @GetMapping public List<Station> all() { return stations.findAll(); }
    @GetMapping("/{id}") public Station one(@PathVariable String id) {
        return stations.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
