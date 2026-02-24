package com.hydra.studios.service.affiliate;

import com.hydra.studios.model.affiliate.AffiliateLog;
import com.hydra.studios.repository.affiliates.AffiliatesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AffiliateService {

    @Autowired
    private AffiliatesRepository affiliatesRepository;

    public void create(AffiliateLog affiliateLog) {
        affiliatesRepository.save(affiliateLog);
    }

    public List<AffiliateLog> findByAffiliateId(String affiliateId) {
        return affiliatesRepository.findAllByAffiliateId(affiliateId);
    }
}
