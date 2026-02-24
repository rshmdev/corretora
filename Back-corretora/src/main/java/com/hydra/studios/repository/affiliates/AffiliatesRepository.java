package com.hydra.studios.repository.affiliates;

import com.hydra.studios.model.affiliate.AffiliateLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffiliatesRepository extends MongoRepository<AffiliateLog, String> {

    List<AffiliateLog> findAllByAffiliateId(String affiliateId);
}
