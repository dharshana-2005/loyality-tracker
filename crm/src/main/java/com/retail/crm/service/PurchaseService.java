package com.retail.crm.service;

import com.retail.crm.dto.DiscountPreviewResponse;
import com.retail.crm.dto.PurchaseRequest;
import com.retail.crm.dto.PurchaseResponse;
import com.retail.crm.entity.Customer;
import com.retail.crm.entity.Purchase;
import com.retail.crm.repository.CustomerRepository;
import com.retail.crm.repository.PurchaseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
public class PurchaseService {
    private static final double RANDOM_COST_DIFF_MIN = 100.0;
    private static final double RANDOM_COST_DIFF_MAX = 150.0;

    private final PurchaseRepository purchaseRepository;
    private final CustomerRepository customerRepository;
    private final DiscountPredictionService discountPredictionService;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           CustomerRepository customerRepository,
                           DiscountPredictionService discountPredictionService) {
        this.purchaseRepository = purchaseRepository;
        this.customerRepository = customerRepository;
        this.discountPredictionService = discountPredictionService;
    }

    public DiscountPreviewResponse previewDiscount(PurchaseRequest request) {
        PurchaseCalculationContext context = buildCalculationContext(request);

        return new DiscountPreviewResponse(
                context.customer().getId(),
                context.customer().getName(),
                context.customer().getPhone(),
                context.totalPurchases(),
                context.loyaltyScore(),
                context.prediction().loyaltyThreshold(),
                context.prediction().eligibleForDiscount(),
                context.originalAmount(),
                context.prediction().discountPercent(),
                context.prediction().discountAmount(),
                context.prediction().finalAmount(),
                context.prediction().modelVersion(),
                context.prediction().customerSegment(),
                context.prediction().profitSafeMaxDiscountPercent(),
                context.prediction().marginGuardApplied(),
                context.prediction().profitBasedMaxDiscountPercent(),
                context.prediction().originalCost(),
                context.prediction().grossProfitBeforeDiscount(),
                context.prediction().netProfitAfterDiscount(),
                context.prediction().minimumRetainedProfitAmount()
        );
    }

    public PurchaseResponse addPurchaseByPhone(PurchaseRequest request) {
        PurchaseCalculationContext context = buildCalculationContext(request);

        Purchase purchase = new Purchase();
        purchase.setAmount(context.prediction().finalAmount());
        purchase.setCustomer(context.customer());

        Purchase savedPurchase = purchaseRepository.save(purchase);

        return new PurchaseResponse(
                savedPurchase.getId(),
                savedPurchase.getPurchaseDate(),
                context.customer().getId(),
                context.customer().getName(),
                context.customer().getPhone(),
                context.originalAmount(),
                context.prediction().discountPercent(),
                context.prediction().discountAmount(),
                context.prediction().finalAmount(),
                context.prediction().originalCost(),
                context.prediction().grossProfitBeforeDiscount(),
                context.prediction().netProfitAfterDiscount()
        );
    }

    private PurchaseCalculationContext buildCalculationContext(PurchaseRequest request) {
        String phoneNumber = request.getPhoneNumber() == null ? "" : request.getPhoneNumber().trim();
        Double amount = request.getAmount();
        Double originalCost = request.getOriginalCost();

        if (phoneNumber.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }

        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        double resolvedOriginalCost = resolveOriginalCost(amount, originalCost);

        List<Customer> customers = customerRepository.findAllByPhone(phoneNumber);
        if (customers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found for phone number");
        }

        if (customers.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Multiple customers found for this phone number");
        }

        Customer customer = customers.get(0);
        List<Purchase> purchases = purchaseRepository.findByCustomer_Id(customer.getId());
        long totalPurchases = purchases.size();
        double totalAmountSpent = purchases.stream()
                .map(Purchase::getAmount)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();
        LocalDateTime lastPurchaseDate = purchases.stream()
                .map(Purchase::getPurchaseDate)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        double loyaltyScore = totalPurchases == 0 ? 0.0 : totalAmountSpent / totalPurchases;
        String discountSeedKey = customer.getId()
                + "|"
                + phoneNumber
                + "|"
                + roundMoney(amount)
                + "|"
                + roundMoney(resolvedOriginalCost);

        DiscountPredictionService.DiscountPrediction prediction =
                discountPredictionService.predict(
                        loyaltyScore,
                        totalPurchases,
                        totalAmountSpent,
                        amount,
                        lastPurchaseDate,
                        resolvedOriginalCost,
                        discountSeedKey
                );

        return new PurchaseCalculationContext(
                customer,
                amount,
                resolvedOriginalCost,
                totalPurchases,
                loyaltyScore,
                prediction
        );
    }

    private double resolveOriginalCost(double amount, Double requestedOriginalCost) {
        if (requestedOriginalCost != null) {
            if (requestedOriginalCost < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Original cost must be zero or greater");
            }

            if (requestedOriginalCost >= amount) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Original cost must be lower than selling amount");
            }

            return roundMoney(requestedOriginalCost);
        }

        return generateRandomOriginalCost(amount);
    }

    private double generateRandomOriginalCost(double amount) {
        double maxDifference = Math.min(RANDOM_COST_DIFF_MAX, Math.max(1.0, amount - 1.0));
        double minDifference = Math.min(RANDOM_COST_DIFF_MIN, maxDifference);
        double difference;

        if (maxDifference <= minDifference) {
            difference = maxDifference;
        } else {
            difference = ThreadLocalRandom.current().nextDouble(minDifference, maxDifference);
        }

        return roundMoney(Math.max(0.0, amount - difference));
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record PurchaseCalculationContext(
            Customer customer,
            double originalAmount,
            double originalCost,
            long totalPurchases,
            double loyaltyScore,
            DiscountPredictionService.DiscountPrediction prediction
    ) {
    }
}
