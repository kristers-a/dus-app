package lv.dus.backend.suggestion;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
public class SuggestionController {
    private final SuggestionRepository suggestions;
    private final PriceService prices;
    public SuggestionController(SuggestionRepository suggestions, PriceService prices) {
        this.suggestions=suggestions; this.prices=prices;
    }
    @PostMapping("/api/price-suggestions")
    @ResponseStatus(HttpStatus.CREATED)
    public PriceSuggestion submit(@Valid @RequestBody PriceRequest r, Authentication auth) {
        String price=prices.validate(r);
        boolean same=prices.station(r.stationId()).fuelPrices().stream().anyMatch(p ->
            p.fuelType().equals(r.fuelType()) && new BigDecimal(p.price()).compareTo(new BigDecimal(price))==0);
        if(same) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Piedāvātā cena sakrīt ar pašreizējo");
        return suggestions.save(new PriceSuggestion(null,r.stationId(),r.fuelType(),price,
            auth.getName(),Instant.now(),"PENDING",null,null,null));
    }
    @GetMapping("/api/moderation/suggestions")
    public List<PriceSuggestion> pending() { return suggestions.findByStatusOrderBySubmittedAtAsc("PENDING"); }
    @PutMapping("/api/moderation/prices")
    public void update(@Valid @RequestBody PriceRequest r) { prices.update(r); }
    @PostMapping("/api/moderation/suggestions/{id}/review")
    public PriceSuggestion review(@PathVariable String id, @RequestBody Map<String,String> body, Authentication auth) {
        PriceSuggestion s=suggestions.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!s.status().equals("PENDING")) throw new ResponseStatusException(HttpStatus.CONFLICT,"Piedāvājums jau apstrādāts");
        String decision=body.get("decision");
        if(!"APPROVED".equals(decision) && !"REJECTED".equals(decision))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nederīgs lēmums");
        String reason=body.getOrDefault("reason", "").trim();
        if("REJECTED".equals(decision) && reason.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Norādi noraidījuma iemeslu");
        if("APPROVED".equals(decision)) prices.update(new PriceRequest(s.stationId(),s.fuelType(),s.proposedPrice()));
        return suggestions.save(new PriceSuggestion(s.id(),s.stationId(),s.fuelType(),s.proposedPrice(),
            s.submittedBy(),s.submittedAt(),decision,auth.getName(),Instant.now(),reason));
    }
}
