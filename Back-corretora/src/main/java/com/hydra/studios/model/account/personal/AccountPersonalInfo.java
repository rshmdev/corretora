package com.hydra.studios.model.account.personal;

import com.hydra.studios.model.account.personal.address.AccountPersonalAddress;
import com.hydra.studios.model.account.personal.address.country.AccountPersonalCountry;
import com.hydra.studios.model.account.personal.gender.AccountPersonalGender;
import lombok.*;

@Builder
@Getter @Setter
@AllArgsConstructor
public class AccountPersonalInfo {

    private AccountPersonalAddress address;

    private String cpf;
    private String dateOfBirth;
    private AccountPersonalGender gender;

    private String phone;

    public AccountPersonalInfo() {
        this.address = new AccountPersonalAddress();

        this.cpf = "";
        this.dateOfBirth = "";
        this.gender = AccountPersonalGender.MALE;

        this.phone = "";
    }
}
