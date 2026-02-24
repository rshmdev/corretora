package com.hydra.studios.model.account.personal.gender;

import lombok.Getter;

@Getter
public enum AccountPersonalGender {

    MALE("Masculino"),
    FEMALE("Feminino"),
    NOT_SPECIFIED("Não-binário"),;

    String text;

    AccountPersonalGender(String text) {
        this.text = text;
    }

}
