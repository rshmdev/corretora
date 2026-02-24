package com.hydra.studios.model.system.gateway;

import lombok.*;

@Builder
@Getter @Setter
@AllArgsConstructor
public class GatewayConfig {

    private String url;
    private String clientId;
    private String apiToken;

    public GatewayConfig() {
        this.url = "https://api.tribopay.com.br/api/public/v1";
        this.apiToken = "";
        this.clientId = "";
    }
}
