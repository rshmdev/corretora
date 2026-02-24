package com.hydra.studios.model.system;

import com.hydra.studios.model.system.gateway.GatewayConfig;
import com.hydra.studios.model.system.transaction.TransactionConfig;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "system_config")
public class SystemConfig {

    @Id
    private String id;

    private String name;
    private String description;

    private String logo;
    private String favicon;

    private String url;

    private TransactionConfig transaction;
    private GatewayConfig gateway;

    private int winPercent;

}
