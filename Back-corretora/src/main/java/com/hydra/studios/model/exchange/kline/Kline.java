package com.hydra.studios.model.exchange.kline;

import lombok.*;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Kline {

    private String pair;
    private double value;
    private long delete;

}
