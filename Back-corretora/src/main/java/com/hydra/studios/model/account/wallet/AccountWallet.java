package com.hydra.studios.model.account.wallet;

import lombok.*;

@Builder
@Getter @Setter
@AllArgsConstructor
public class AccountWallet {

    private double demo;

    private double deposit;
    private double balance;

    private double affiliate;

    private double bonus;

    public AccountWallet() {
        this.demo = 10000.0;
        this.deposit = 0.0;
        this.balance = 0.0;
        this.bonus = 0.0;
    }
}
