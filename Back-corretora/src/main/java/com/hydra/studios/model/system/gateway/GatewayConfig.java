package com.hydra.studios.model.system.gateway;

import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
public class GatewayConfig {

    private String url;
    private String clientId;
    private String clientSecret;
    private String apiToken; // mantido para compatibilidade legada

    public GatewayConfig() {
        this.url = "https://api.veopag.com";
        this.clientId = "";
        this.clientSecret = "";
        this.apiToken = "";
    }
}
