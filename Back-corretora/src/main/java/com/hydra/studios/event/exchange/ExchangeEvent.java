package com.hydra.studios.event.exchange;

import com.hydra.studios.service.binance.BinanceKlineService;
import com.hydra.studios.service.exchange.ExchangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ExchangeEvent {

    @Autowired
    private ExchangeService exchangeService;

    @Autowired
    private BinanceKlineService binanceKlineService;

    @EventListener(ApplicationReadyEvent.class)
    public void syncExchangeRates() {
        System.out.println("Starting exchange rates sync...");
        var pairs = exchangeService.getBinancePairs();

        var founded = pairs.size();
        var size = 0;

        for (var pair : pairs) {
            var existing = exchangeService.findBySymbol(pair.getSymbol());
            if (existing == null) {
                size++;
                pair.setId(UUID.randomUUID().toString());
                exchangeService.save(pair);
            }
        }

        System.out.println("Exchange rates sync completed. Founded: " + founded + ", New added: " + size);

        var allPairs = exchangeService.getAllPairs();

        String[] pr = allPairs.stream()
                .map(pair -> pair.getSymbol().toLowerCase().replace("/", ""))
                .toArray(String[]::new);

        System.out.println("Starting Binance Kline Service for pairs: " + pr.length + " in 1m interval.");

        binanceKlineService.connectMultiplePairs(pr, "1m");
        binanceKlineService.connectMultiplePairs(pr, "5m");
        binanceKlineService.connectMultiplePairs(pr, "10m");
    }
}
