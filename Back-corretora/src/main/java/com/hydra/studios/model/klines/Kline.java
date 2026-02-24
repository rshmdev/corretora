package com.hydra.studios.model.klines;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@Document(collection = "klines")
public class Kline {

    @Id
    private String id;
    private String pair;
    private String interval;
    private long openTime;
    private double open;
    private double high;
    private double low;
    private double close;
    private long closeTime;
}
