package com.hydra.studios.service.exchange;

import com.google.gson.JsonArray;
import com.hydra.studios.component.binance.BinanceComponent;
import com.hydra.studios.model.exchange.Exchange;
import com.hydra.studios.repository.exchange.ExchangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExchangeService {

    @Autowired
    private BinanceComponent binance;

    @Autowired
    private ExchangeRepository exchangeRepository;

    public Exchange findBySymbol(String symbol) {
        return exchangeRepository.findBySymbol(symbol);
    }

    public Exchange findByExchange(String exchange) {
        return exchangeRepository.findByExchange(exchange);
    }

    public List<Exchange> getAllPairs() {
        return exchangeRepository.findAll();
    }

    public List<Exchange> getBinancePairs() {
        return binance.getAllPairs();
    }

    public void save(Exchange exchange) {
        exchangeRepository.save(exchange);
    }
}
