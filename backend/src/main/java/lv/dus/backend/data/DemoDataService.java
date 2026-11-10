package lv.dus.backend.data;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import lv.dus.backend.station.*;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
/** Loads the editable station/price list (dus.data-file) and syncs it into MongoDB when the file content changes. */
@Service
public class DemoDataService {
    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);
    private static final Set<String> CHAINS = Set.of("circlek","virsi","neste","viada","straujupite","kool","other");
    private static final Set<String> STATION_TYPES = Set.of("automated","staffed","unknown");
    private final Path file; private final StationRepository stations;
    private final MongoTemplate mongo; private final JsonMapper json;
    private volatile DemoData current; private long lastModified = -1;
    public DemoDataService(@Value("${dus.data-file:data/stations.json}") String file, StationRepository stations,
                           MongoTemplate mongo, JsonMapper json) {
        this.file = Path.of(file); this.stations = stations; this.mongo = mongo; this.json = json;
    }
    @EventListener(ApplicationReadyEvent.class) public void onStart() { refresh(); }
    public List<DemoData.Source> sources() { return current == null || current.sources() == null ? List.of() : current.sources(); }
    public Map<String,Integer> offsetsCents() {
        return current == null || current.estimateOffsetsCents() == null ? Map.of() : current.estimateOffsetsCents();
    }
    /** Re-reads the file if it was modified. An invalid file is logged and ignored; the last good data stays. */
    public synchronized void refresh() {
        try {
            if (!Files.exists(file)) { if (lastModified != 0) log.warn("Datu fails {} nav atrasts", file.toAbsolutePath()); lastModified = 0; return; }
            long modified = Files.getLastModifiedTime(file).toMillis();
            if (modified == lastModified) return;
            lastModified = modified;
            byte[] bytes = Files.readAllBytes(file);
            DemoData data = json.readValue(bytes, DemoData.class);
            validate(data);
            current = data;
            String hash = sha256(bytes);
            Document meta = mongo.findById("demo-data", Document.class, "appMeta");
            if (meta != null && hash.equals(meta.getString("hash"))) return;
            sync(data);
            mongo.save(new Document("_id","demo-data").append("hash",hash).append("syncedAt",Instant.now().toString()), "appMeta");
            log.info("Datu fails {} ielādēts: {} stacijas, {} cenu ieraksti", file, data.stations().size(), data.observations().size());
        } catch (JacksonException | IllegalArgumentException | IOException e) {
            log.error("DATU FAILS {} NAV DERĪGS, paliek iepriekšējie dati: {}", file.toAbsolutePath(), e.getMessage());
        }
    }
    private void sync(DemoData data) {
        Map<String,String> sourceLabels = new HashMap<>();
        if (data.sources() != null) data.sources().forEach(s -> sourceLabels.put(s.chain(), s.label()));
        List<Station> result = new ArrayList<>();
        for (var e : data.stations()) {
            var applicable = data.observations().stream().filter(o -> e.id().equals(o.stationId())
                || (o.isNetworkWide() && e.chain().equals(o.chain()) && e.fuels().contains(o.fuel())))
                .sorted(Comparator.comparing(DemoData.Observation::effectiveDate)
                    .thenComparing(o -> o.stationId() != null)).toList();
            Map<String,DemoData.Observation> latest = new LinkedHashMap<>();
            applicable.forEach(o -> latest.put(o.fuel(), o));
            var prices = latest.values().stream().map(o -> new Station.FuelPrice(o.fuel(), format(o.price()),
                    o.fetchedAt() != null ? o.fetchedAt() : o.effectiveDate(), "listed",
                    sourceLabels.getOrDefault(e.chain(), e.chain()), o.sourceUrl(), o.effectiveDate()))
                .sorted(Comparator.comparingInt(p -> Station.FUELS.indexOf(p.fuelType()))).toList();
            var history = applicable.stream().map(o -> new Station.HistoryPoint(o.fuel(), format(o.price()), o.effectiveDate())).toList();
            result.add(new Station(e.id(), e.name(), e.address(), e.latitude(), e.longitude(),
                e.description() == null ? "" : e.description(), prices, e.chain(), e.stationType(), true, e.fuels(), history));
        }
        Set<String> ids = new HashSet<>(result.stream().map(Station::id).toList());
        stations.deleteAll(stations.findAll().stream().filter(s -> !ids.contains(s.id())).toList());
        stations.saveAll(result);
    }
    static void validate(DemoData d) {
        if (d.stations() == null || d.stations().isEmpty()) throw new IllegalArgumentException("stations ir tukšs");
        if (d.observations() == null) throw new IllegalArgumentException("observations nav norādīts");
        Map<String,DemoData.StationEntry> byId = new HashMap<>();
        for (var s : d.stations()) {
            String at = "stacija " + s.id();
            if (s.id() == null || s.id().isBlank()) throw new IllegalArgumentException("stacijai trūkst id");
            if (byId.put(s.id(), s) != null) throw new IllegalArgumentException(at + ": dublēts id");
            if (!CHAINS.contains(s.chain())) throw new IllegalArgumentException(at + ": nezināms chain " + s.chain());
            if (!STATION_TYPES.contains(s.stationType())) throw new IllegalArgumentException(at + ": nezināms stationType " + s.stationType());
            if (s.name() == null || s.address() == null) throw new IllegalArgumentException(at + ": trūkst name/address");
            if (s.latitude() == null || s.longitude() == null || s.latitude() < 55.6 || s.latitude() > 58.1
                || s.longitude() < 20.9 || s.longitude() > 28.3) throw new IllegalArgumentException(at + ": koordinātas ārpus Latvijas");
            if (s.fuels() == null || s.fuels().isEmpty() || !Station.FUELS.containsAll(s.fuels()))
                throw new IllegalArgumentException(at + ": fuels jābūt no " + Station.FUELS);
        }
        for (int i = 0; i < d.observations().size(); i++) {
            var o = d.observations().get(i);
            String at = "observations[" + i + "]";
            if (!Station.FUELS.contains(o.fuel())) throw new IllegalArgumentException(at + ": nezināms fuel " + o.fuel());
            if (o.price() == null) throw new IllegalArgumentException(at + ": trūkst price");
            boolean lpg = o.fuel().equals("LPG");
            BigDecimal min = new BigDecimal(lpg ? "0.5" : "0.8"), max = new BigDecimal(lpg ? "2.0" : "3.5");
            if (o.price().compareTo(min) < 0 || o.price().compareTo(max) > 0)
                throw new IllegalArgumentException(at + ": cena " + o.price() + " ārpus " + min + "–" + max + " EUR/L");
            try { LocalDate.parse(o.effectiveDate()); }
            catch (DateTimeParseException | NullPointerException e) { throw new IllegalArgumentException(at + ": effectiveDate jābūt YYYY-MM-DD"); }
            if (o.isNetworkWide()) {
                if (!CHAINS.contains(o.chain())) throw new IllegalArgumentException(at + ": networkWide ierakstam vajag chain");
            } else {
                var s = byId.get(o.stationId());
                if (s == null) throw new IllegalArgumentException(at + ": nezināms stationId " + o.stationId());
                if (!s.fuels().contains(o.fuel())) throw new IllegalArgumentException(at + ": stacijā " + s.id() + " nav " + o.fuel());
            }
        }
    }
    private static String format(BigDecimal price) { return price.setScale(3, RoundingMode.HALF_UP).toPlainString(); }
    private static String sha256(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
