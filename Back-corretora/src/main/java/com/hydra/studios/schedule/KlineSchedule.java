package com.hydra.studios.schedule;

import com.hydra.studios.service.bet.BetService;
import com.hydra.studios.service.binance.BinanceKlineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class KlineSchedule {

    @Autowired
    private BetService betService;

    @Autowired
    private BinanceKlineService binanceKlineService;

    @Scheduled(fixedRate = 1000)
    public void fetchKlines() {
        // No longer needed to cleanup since we only keep the latest per pair in the Map
    }

    @Scheduled(fixedRate = 1000)
    public void closeBets() {
        var klines = binanceKlineService.getKlines();
        var bets = betService.getBetsByFinishIn(System.currentTimeMillis());

        for (var bet : bets) {
            var kline = klines.get(bet.getPair());
            if (kline == null) {
                continue;
            }

            betService.closeBet(bet, kline.getValue());
            System.out.println("Closed bet: " + bet.getId() + " with price: " + kline.getValue());
        }
    }

    @Scheduled(fixedRate = 5000)
    public void fetchKline() {
        var list = binanceKlineService.getKlines();
    }
}
