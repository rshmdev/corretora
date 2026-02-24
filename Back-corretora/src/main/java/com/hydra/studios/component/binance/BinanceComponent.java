package com.hydra.studios.component.binance;

import com.binance.connector.client.common.configuration.ClientConfiguration;
import com.binance.connector.client.spot.rest.api.SpotRestApi;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import com.hydra.studios.model.exchange.Exchange;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class BinanceComponent {

    public List<Exchange> getAllPairs() {
        List<String> quoteAssets = Arrays.asList(
                "USDT", // Stablecoin mais usada
                "USDC", // Segunda em liquidez
                "FDUSD", // Muito usada na Binance
                "DAI", // Descentralizada
                "TUSD", // Bastante presente em pares
                "BRL", // Real brasileiro
                "EUR", // Euro
                "BUSD" // Ainda aparece em vários pares
        );

        List<String> baseWhitelist = Arrays.asList(
                "BTC", // Bitcoin
                "ETH", // Ethereum
                "BNB", // Binance Coin
                "SOL", // Solana
                "XRP", // Ripple
                "ADA", // Cardano
                "DOGE", // Dogecoin
                "MATIC", // Polygon
                "DOT", // Polkadot
                "LTC", // Litecoin
                "LINK", // Chainlink
                "AVAX", // Avalanche
                "SHIB", // Shiba Inu
                "TRX", // TRON
                "PEPE" // Pepe
        );

        List<Exchange> tradingPairs = new ArrayList<>();

        SpotRestApi api = new SpotRestApi(new ClientConfiguration());
        var response = api.exchangeInfo(null, null, null, null, null);

        var jsonResponse = JsonParser.parseString(response.getData().toJson()).getAsJsonObject();
        var symbols = jsonResponse.getAsJsonArray("symbols");

        for (var symbolElement : symbols) {
            var symbol = symbolElement.getAsJsonObject();
            var baseAsset = symbol.get("baseAsset").getAsString();
            var quoteAsset = symbol.get("quoteAsset").getAsString();
            var status = symbol.get("status").getAsString();

            // Filtra por: ativo, quote permitido e base whitelist
            if ("TRADING".equals(status)
                    && quoteAssets.contains(quoteAsset)
                    && baseWhitelist.contains(baseAsset)) {

                Exchange pair = new Exchange();
                pair.setExchange(baseAsset + quoteAsset); // ex: BTCUSDT
                pair.setSymbol(baseAsset + "/" + quoteAsset); // ex: BTC/USDT
                pair.setBaseAsset(baseAsset);
                pair.setQuoteAsset(quoteAsset);

                tradingPairs.add(pair);
            }
        }

        return tradingPairs;
    }

}
