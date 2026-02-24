package com.hydra.studios.repository.klines;

import com.hydra.studios.model.klines.Kline;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface KlineRepository extends MongoRepository<Kline, String> {

    List<Kline> findTop500ByPairAndIntervalOrderByOpenTimeDesc(String pair, String interval);

}
