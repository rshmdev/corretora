package com.hydra.studios.model.account.affiliate;

import lombok.*;

import java.util.UUID;

@Builder
@Getter @Setter
@AllArgsConstructor
public class AccountAffiliate {

    private double cpa; // Win per Deposit
    private int revenueShare; // Percentage of losses

    private int percentPerDeposit; // Percentage of deposit

    private String affiliateId; // Unique ID for affiliate tracking

    public AccountAffiliate() {
        this.cpa = 0.0;
        this.revenueShare = 0;
        this.percentPerDeposit = 0;
        this.affiliateId = UUID.randomUUID().toString();
    }
}
