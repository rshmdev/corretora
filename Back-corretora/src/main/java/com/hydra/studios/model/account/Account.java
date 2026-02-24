package com.hydra.studios.model.account;

import com.hydra.studios.model.account.affiliate.AccountAffiliate;
import com.hydra.studios.model.account.personal.AccountPersonalInfo;
import com.hydra.studios.model.account.personal.address.AccountPersonalAddress;
import com.hydra.studios.model.account.role.AccountRole;
import com.hydra.studios.model.account.wallet.AccountWallet;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "accounts")
public class Account {

    @Id
    private String id;

    private String email;
    private String password;

    private String firstName;
    private String lastName;

    private AccountPersonalInfo personalInfo;

    private AccountRole role;

    private AccountAffiliate affiliate;

    private AccountWallet wallet;

    private String referralCode;

    private long firstLogin;
    private long lastLogin;
}
