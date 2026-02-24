package com.hydra.studios.schedule;

import com.hydra.studios.model.exchange.kline.Kline;
import com.hydra.studios.service.bet.BetService;
import com.hydra.studios.service.binance.BinanceKlineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.stream.Collectors;

@Component
public class KlineSchedule {

    @Autowired
    private BetService betService;

    @Autowired
    private BinanceKlineService binanceKlineService;

    @Scheduled(fixedRate = 1000)
    public void fetchKlines() {
        var klines = binanceKlineService.getKlines();
        var expired = klines.stream().filter(k -> k != null && k.getDelete() < System.currentTimeMillis()).toList();

        klines.removeAll(expired);
    }

    @Scheduled(fixedRate = 1000)
    public void closeBets() {
        var klines = binanceKlineService.getKlines();
        var bets = betService.getBetsByFinishIn(System.currentTimeMillis(), 0);

        for (var bet : bets) {
            var klinesPair = klines.stream().filter(k -> k != null && k.getPair().equals(bet.getPair())).toList();
            var kline = klinesPair.stream().max(Comparator.comparingLong(Kline::getDelete)).orElse(null);
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
