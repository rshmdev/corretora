package com.hydra.studios.service.account;

import com.google.gson.JsonObject;
import com.hydra.studios.model.account.Account;
import com.hydra.studios.model.account.affiliate.AccountAffiliate;
import com.hydra.studios.model.account.personal.gender.AccountPersonalGender;
import com.hydra.studios.model.account.role.AccountRole;
import com.hydra.studios.repository.account.AccountRepository;
import com.hydra.studios.service.transaction.TransactionService;
import com.hydra.studios.ws.controller.AccController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public Account getAccount(String email) {
        return accountRepository.findByEmail(email);
    }

    public Account getAccountById(String id) {
        return accountRepository.findById(id).orElse(null);
    }
    public Account getAccountByPhone(String phone) {
        return accountRepository.findByPersonalInfo_Phone(phone);
    }
    public Account getAccountByAffiliateId(String affiliateId) {
        return accountRepository.findByAffiliate_AffiliateId(affiliateId);
    }

    public List<Account> getAllAccountsByReferralCode(String referralCode) {
        return accountRepository.findAllByReferralCode(referralCode);
    }

    public void edit(Account account, JsonObject body) {
        if (account.getAffiliate() == null) {
            account.setAffiliate(new AccountAffiliate());
        }

        if (body.has("phone")) {
            account.getPersonalInfo().setPhone(body.get("phone").getAsString());
        }
        if (body.has("cpf")) {
            account.getPersonalInfo().setCpf(body.get("cpf").getAsString());
        }
        if (body.has("dateOfBirth")) {
            account.getPersonalInfo().setDateOfBirth(body.get("dateOfBirth").getAsString());
        }
        if (body.has("gender")) {
            account.getPersonalInfo().setGender(AccountPersonalGender.valueOf(body.get("gender").getAsString()));
        }
        if (body.has("demo")) {
            account.getWallet().setDemo(body.get("demo").getAsDouble());
        }
        if (body.has("deposit")) {
            account.getWallet().setDeposit(body.get("deposit").getAsDouble());
        }
        if (body.has("balance")) {
            account.getWallet().setBalance(body.get("balance").getAsDouble());
        }
        if (body.has("bonus")) {
            account.getWallet().setBonus(body.get("bonus").getAsDouble());
        }
        if (body.has("cpa")) {
            account.getAffiliate().setCpa(body.get("cpa").getAsDouble());
        }
        if (body.has("revshare")) {
            account.getAffiliate().setRevenueShare(body.get("revshare").getAsInt());
        }
        if (body.has("percentPerDeposit")) {
            account.getAffiliate().setPercentPerDeposit(body.get("percentPerDeposit").getAsInt());
        }
        if (body.has("role")) {
            account.setRole(AccountRole.valueOf(body.get("role").getAsString()));
        }

        accountRepository.save(account);
    }
    public void delete(Account account) {
        accountRepository.delete(account);
    }

    public void save(Account account) {
        accountRepository.save(account);
    }
}
