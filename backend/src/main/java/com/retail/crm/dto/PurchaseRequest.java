package com.retail.crm.dto;

import lombok.Data;

@Data
public class PurchaseRequest {
    private String phoneNumber;
    private Double amount;
    private Double originalCost;
}
