package com.hydra.studios.model.account.personal.address;

import com.hydra.studios.model.account.personal.address.country.AccountPersonalCountry;
import lombok.*;

@Builder
@Getter @Setter
@AllArgsConstructor
public class AccountPersonalAddress {

    private AccountPersonalCountry country;
    private String state;
    private String city;
    private String street;
    private String zipCode;

    public AccountPersonalAddress() {
        this.country = AccountPersonalCountry.BRAZIL;
        this.state = "";
        this.city = "";
        this.street = "";
        this.zipCode = "";
    }
}
