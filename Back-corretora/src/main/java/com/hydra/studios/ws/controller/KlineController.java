package com.hydra.studios.ws.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class KlineController {

    private final SimpMessagingTemplate messagingTemplate;

    public KlineController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public void publishKline(String pair, String interval, Object klineData) {
        messagingTemplate.convertAndSend("/topic/klines/" + pair + "/" + interval, klineData);
    }

}
