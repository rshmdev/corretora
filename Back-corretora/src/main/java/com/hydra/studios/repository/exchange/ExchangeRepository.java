package com.hydra.studios.repository.exchange;

import com.hydra.studios.model.exchange.Exchange;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExchangeRepository extends MongoRepository<Exchange, String> {

    Exchange findBySymbol(String symbol);
    Exchange findByExchange(String exchange);
}
