package com.hydra.studios.model.exchange;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exchanges")
public class Exchange {

    @Id
    private String id;

    private String symbol;
    private String exchange;

    private String baseAsset;
    private String quoteAsset;

}
