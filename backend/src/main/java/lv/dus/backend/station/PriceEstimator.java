package lv.dus.backend.station;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Predicate;
/**
 * Read-time estimates for fuels a station sells but has no listed price for. Listed prices are the cheapest
 * in each network, so the medians are likely lower bounds; estimateOffsetsCents can shift them per chain.
 */
public final class PriceEstimator {
    private PriceEstimator() {}
    private record Listed(String chain, String stationType, String fuel, BigDecimal price, String updatedAt, String effectiveDate) {}
    public static List<Station> withEstimates(List<Station> stations, Map<String,Integer> offsetsCents) {
        List<Listed> listed = new ArrayList<>();
        for (var s : stations) for (var p : prices(s)) if (p.kind() == null || p.kind().equals("listed"))
            listed.add(new Listed(s.chain(), s.stationType(), p.fuelType(), new BigDecimal(p.price()), p.updatedAt(), p.effectiveDate()));
        return stations.stream().map(s -> {
            if (s.fuels() == null) return s;
            var result = new ArrayList<>(prices(s));
            for (String fuel : Station.FUELS) {
                if (!s.fuels().contains(fuel) || result.stream().anyMatch(p -> p.fuelType().equals(fuel))) continue;
                Predicate<Listed> sameFuel = l -> l.fuel().equals(fuel);
                Predicate<Listed> sameChain = sameFuel.and(l -> Objects.equals(l.chain(), s.chain()));
                Predicate<Listed> sameGroup = sameChain.and(l -> Objects.equals(l.stationType(), s.stationType()));
                var estimate = estimate(listed, sameGroup, "estimated_group", fuel, s, offsetsCents);
                if (estimate == null) estimate = estimate(listed, sameChain, "estimated_chain", fuel, s, offsetsCents);
                if (estimate == null) estimate = estimate(listed, sameFuel, "estimated_market", fuel, s, offsetsCents);
                if (estimate != null) result.add(estimate);
            }
            result.sort(Comparator.comparingInt(p -> Station.FUELS.indexOf(p.fuelType())));
            return s.withPrices(result, s.priceHistory());
        }).toList();
    }
    private static Station.FuelPrice estimate(List<Listed> listed, Predicate<Listed> filter, String kind, String fuel,
                                              Station s, Map<String,Integer> offsetsCents) {
        var basis = listed.stream().filter(filter).toList();
        if (basis.isEmpty()) return null;
        var sorted = basis.stream().map(Listed::price).sorted().toList();
        int n = sorted.size();
        BigDecimal median = n % 2 == 1 ? sorted.get(n / 2)
            : sorted.get(n / 2 - 1).add(sorted.get(n / 2)).divide(BigDecimal.TWO, 3, RoundingMode.HALF_UP);
        int offset = offsetsCents.getOrDefault(s.chain(), 0);
        BigDecimal price = median.add(BigDecimal.valueOf(offset, 2)).setScale(3, RoundingMode.HALF_UP);
        String updatedAt = basis.stream().map(Listed::updatedAt).filter(Objects::nonNull).max(String::compareTo).orElse(null);
        String effectiveDate = basis.stream().map(Listed::effectiveDate).filter(Objects::nonNull).max(String::compareTo).orElse(null);
        String source = "mediāna no " + n + " cenām" + (offset != 0 ? ", korekcija " + (offset > 0 ? "+" : "") + offset + " c" : "");
        return new Station.FuelPrice(fuel, price.toPlainString(), updatedAt, kind, source, null, effectiveDate);
    }
    private static List<Station.FuelPrice> prices(Station s) { return s.fuelPrices() == null ? List.of() : s.fuelPrices(); }
}
