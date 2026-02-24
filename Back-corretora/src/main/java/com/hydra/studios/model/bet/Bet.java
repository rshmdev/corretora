package com.hydra.studios.model.bet;

import com.hydra.studios.model.bet.arrow.BetArrow;
import com.hydra.studios.model.bet.status.BetStatus;
import lombok.*;
import org.springframework.data.annotation.Id;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bet {

    @Id
    private String id;
    private String accountId;

    private String pair;
    private String interval;

    private BetArrow arrow;

    private double bet;
    private double result;

    private double starredPrice;
    private double finishedPrice;

    private BetStatus status;

    private long createdAt;
    private long finishIn;

    private boolean demo;
    private boolean finished;

}
