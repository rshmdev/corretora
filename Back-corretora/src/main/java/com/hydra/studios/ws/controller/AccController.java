package com.hydra.studios.ws.controller;

import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.model.account.Account;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class AccController {

    private final SimpMessagingTemplate messagingTemplate;

    public AccController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public void publish(String accountId, Account acc) {
        var json = JsonParser.parseString(App.getGson().toJson(acc)).getAsJsonObject();

        json.remove("password");

        messagingTemplate.convertAndSend("/topic/account/" + accountId, json.toString());
    }

    public void publishBet(String accountId, String message) {
        messagingTemplate.convertAndSend("/topic/bets/" + accountId, message);
    }
}
