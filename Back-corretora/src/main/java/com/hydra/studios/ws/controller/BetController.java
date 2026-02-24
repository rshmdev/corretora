package com.hydra.studios.ws.controller;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.component.jwt.JWTComponent;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.bet.BetService;
import com.hydra.studios.service.exchange.ExchangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.concurrent.TimeUnit;

@Controller
public class BetController {

    @Autowired
    private JWTComponent jwtComponent;

    @Autowired
    private AccountService accountService;

    @Autowired
    private ExchangeService exchangeService;

    @Autowired
    private BetService betService;

    private HashMap<String, Long> cooldowns = new HashMap<>();

    private final SimpMessagingTemplate messagingTemplate;

    public BetController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/bet")
    public void handle(@Payload String string) {
        var message = JsonParser.parseString(string).getAsJsonObject();

        var token = message.get("token").getAsString();
        var username = jwtComponent.extractUsername(token);
        var user = accountService.getAccount(username);

        if (!message.has("pair") || !message.has("bet") || !message.has("interval") || !message.has("arrow")) {
            var object = new JsonObject();
            object.addProperty("status", "error");
            object.addProperty("message", "Invalid message format");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        var pair = message.get("pair").getAsString();
        var bet = message.get("bet").getAsDouble();
        var interval = message.get("interval").getAsString();
        var arrow = message.get("arrow").getAsString();
        var demo = message.has("demo") ? message.get("demo").getAsBoolean() : false;

        var betArrow = switch (arrow.toLowerCase()) {
            case "up" -> com.hydra.studios.model.bet.arrow.BetArrow.UP;
            case "down" -> com.hydra.studios.model.bet.arrow.BetArrow.DOWN;
            default -> null;
        };

        var object = new JsonObject();

        if (!interval.equals("1m") && !interval.equals("5m") && !interval.equals("15m")) {
            object.addProperty("status", "error");
            object.addProperty("message", "Invalid interval (" + interval + ") only 1m, 5m and 15m are allowed");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        if (user == null) {
            object.addProperty("status", "error");
            object.addProperty("message", "User not found");
            // Nota: Se user for null, não temos o ID para a rota personalizada,
            // então não enviamos nada ou enviamos para um log de erro.
            return;
        }

        if (cooldowns.containsKey(user.getEmail()) && cooldowns.get(user.getEmail()) > System.currentTimeMillis()) {
            object.addProperty("status", "error");
            object.addProperty("message", "You are on cooldown, please wait "
                    + ((cooldowns.get(user.getEmail()) - System.currentTimeMillis()) / 1000) + " seconds");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        cooldowns.put(user.getEmail(), System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(2));

        var balanceTotal = (demo ? user.getWallet().getDemo()
                : user.getWallet().getBalance() + user.getWallet().getDeposit() + user.getWallet().getBonus());

        if (bet > balanceTotal) {
            object.addProperty("status", "error");
            object.addProperty("message", "Insufficient balance");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        var exchange = exchangeService.findByExchange(pair);

        if (exchange == null) {
            object.addProperty("status", "error");
            object.addProperty("message", "Exchange pair not found");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        var save = betService.createBet(user, pair, bet, interval, betArrow, demo);

        if (save == null) {
            object.addProperty("status", "error");
            object.addProperty("message", "Failed to create bet");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        var betResponse = new JsonObject();
        betResponse.addProperty("id", save.getId());
        betResponse.addProperty("pair", save.getPair());
        betResponse.addProperty("interval", save.getInterval());
        betResponse.addProperty("arrow", save.getArrow() != null ? save.getArrow().name() : "UP");
        betResponse.addProperty("bet", save.getBet());
        betResponse.addProperty("starredPrice", save.getStarredPrice());
        betResponse.addProperty("createdAt", save.getCreatedAt());
        betResponse.addProperty("finishIn", save.getFinishIn());
        betResponse.addProperty("demo", save.isDemo());
        messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), betResponse.toString());
    }

    @MessageMapping("/cashout")
    public void handleCashout(@Payload String string) {
        var message = JsonParser.parseString(string).getAsJsonObject();
        var token = message.get("token").getAsString();
        var username = jwtComponent.extractUsername(token);
        var user = accountService.getAccount(username);
        var object = new JsonObject();

        if (!message.has("betId")) {
            object.addProperty("status", "error");
            object.addProperty("message", "Invalid message format: betId missing");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        var betId = message.get("betId").getAsString();
        var bet = betService.closeBetCashout(betId);

        if (bet == null) {
            object.addProperty("status", "error");
            object.addProperty("message", "Bet not found or already closed");
            messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
            return;
        }

        object.addProperty("status", "ok");
        object.addProperty("message", "Cashout processed successfully");
        messagingTemplate.convertAndSend("/topic/bets/" + user.getId().toString(), object.toString());
    }
}
