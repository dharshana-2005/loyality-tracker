package com.retail.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CustomerSummary {

    private Long totalPurchases;
    private Double totalAmountSpent;
    private Double loyaltyScore;
    private Double loyaltyThreshold;
    private Boolean eligibleForDiscount;
    private LocalDateTime lastPurchaseDate;
}
