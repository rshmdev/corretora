package com.hydra.studios.model.affiliate;

import com.hydra.studios.model.affiliate.revenue.AffiliateRevenueType;
import com.hydra.studios.model.affiliate.type.AffiliateType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@AllArgsConstructor
@Document(collection = "affiliate_logs")
public class AffiliateLog {

    @Id
    private String id;
    private String affiliateId;
    private String operationId;

    private String userId;
    private String userName;

    private AffiliateType affiliateType;
    private AffiliateRevenueType revenueType;

    private double amountBase;
    private double totalWin;

    private long createdAt;
}