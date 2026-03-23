package com.retail.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DiscountPreviewResponse {
    private Long customerId;
    private String customerName;
    private String phoneNumber;
    private Long totalPurchases;
    private Double loyaltyScore;
    private Double loyaltyThreshold;
    private Boolean eligibleForDiscount;
    private Double originalAmount;
    private Double discountPercent;
    private Double discountAmount;
    private Double finalAmount;
    private String modelVersion;
    private String customerSegment;
    private Double profitSafeMaxDiscountPercent;
    private Boolean marginGuardApplied;
    private Double profitBasedMaxDiscountPercent;
    private Double originalCost;
    private Double grossProfitBeforeDiscount;
    private Double netProfitAfterDiscount;
    private Double minimumRetainedProfitAmount;
}
