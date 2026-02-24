package com.hydra.studios.repository.account;

import com.hydra.studios.model.account.Account;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends MongoRepository<Account, String> {

    Account findByEmail(String email);

    Account findByPersonalInfo_Phone(String phone);
    Account findByAffiliate_AffiliateId(String affiliateId);

    List<Account> findAllByReferralCode(String referralCode);
    int countByFirstLoginBefore(long date);
}
