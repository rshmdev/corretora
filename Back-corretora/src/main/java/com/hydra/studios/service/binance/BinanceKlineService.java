package com.hydra.studios.service.binance;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.model.exchange.kline.Kline;
import com.hydra.studios.repository.klines.KlineRepository;
import com.hydra.studios.ws.controller.KlineController;
import lombok.Getter;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class BinanceKlineService {

    private final KlineController klineController;
    private final OkHttpClient client = new OkHttpClient();

    @Autowired
    private KlineRepository klineRepository;

    @Getter
    private Map<String, Kline> klines = new ConcurrentHashMap<>();

    public BinanceKlineService(KlineController klineController) {
        this.klineController = klineController;
    }

    public void connectMultiplePairs(String[] pairs, String interval) {
        StringBuilder url = new StringBuilder("wss://stream.binance.com:9443/stream?streams=");

        for (int i = 0; i < pairs.length; i++) {
            if (i > 0)
                url.append("/");
            url.append(pairs[i].toLowerCase()).append("@kline_").append(interval);
        }

        Request request = new Request.Builder().url(url.toString()).build();

        client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                JsonObject json = JsonParser.parseString(text).getAsJsonObject();
                var data = json.getAsJsonObject("data");

                String pair = data.get("s").getAsString();
                var klineData = data.getAsJsonObject("k");

                var kl = com.hydra.studios.model.klines.Kline.builder()
                        .pair(pair)
                        .interval(interval)
                        .openTime(klineData.get("t").getAsLong())
                        .open(klineData.get("o").getAsDouble())
                        .high(klineData.get("h").getAsDouble())
                        .low(klineData.get("l").getAsDouble())
                        .close(klineData.get("c").getAsDouble())
                        .closeTime(klineData.get("T").getAsLong())
                        .build();

                var simpleKline = Kline.builder()
                        .pair(pair)
                        .value(kl.getClose())
                        .delete(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(31))
                        .build();

                klines.put(pair, simpleKline);

                klineController.publishKline(pair, interval, kl);
            }
        });
    }

}
