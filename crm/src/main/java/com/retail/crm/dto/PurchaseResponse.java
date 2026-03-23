package com.retail.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PurchaseResponse {
    private Long purchaseId;
    private LocalDateTime purchaseDate;
    private Long customerId;
    private String customerName;
    private String phoneNumber;
    private Double originalAmount;
    private Double discountPercent;
    private Double discountAmount;
    private Double finalAmount;
    private Double originalCost;
    private Double grossProfitBeforeDiscount;
    private Double netProfitAfterDiscount;
}
