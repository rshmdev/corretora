package com.hydra.studios.event.ready;

import com.hydra.studios.service.system.SystemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ReadyEvent {

    @Autowired
    private SystemService systemService;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        systemService.getSystem();
    }
}
