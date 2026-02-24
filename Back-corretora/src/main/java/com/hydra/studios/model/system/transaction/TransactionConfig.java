package com.hydra.studios.model.system.transaction;

import lombok.*;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionConfig {

    private double minDeposit;
    private double minWithdraw;

}
