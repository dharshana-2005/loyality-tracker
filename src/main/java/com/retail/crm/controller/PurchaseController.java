package com.retail.crm.controller;

import com.retail.crm.dto.DiscountPreviewResponse;
import com.retail.crm.dto.PurchaseRequest;
import com.retail.crm.dto.PurchaseResponse;
import com.retail.crm.service.PurchaseService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/purchases")
@CrossOrigin
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping("/discount-preview")
    public DiscountPreviewResponse previewDiscount(@RequestBody PurchaseRequest request) {
        return purchaseService.previewDiscount(request);
    }

    @PostMapping
    public PurchaseResponse addPurchase(@RequestBody PurchaseRequest request) {
        return purchaseService.addPurchaseByPhone(request);
    }
}
