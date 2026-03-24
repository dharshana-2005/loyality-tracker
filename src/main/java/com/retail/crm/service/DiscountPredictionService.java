package com.retail.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
public class DiscountPredictionService {

    private static final String MODEL_VERSION = "LOYALTY_AI_V2";
    private static final double RANDOM_DISCOUNT_CAP_AMOUNT = 100.0;

    private final double loyaltyThreshold;
    private final double minDiscountPercent;
    private final double maxDiscountPercent;
    private final double estimatedMarginPercent;
    private final double minRetainedMarginPercent;
    private final double maxDiscountShareOfProfitPercent;

    public DiscountPredictionService(
            @Value("${loyalty.discount.threshold:500}") double loyaltyThreshold,
            @Value("${loyalty.discount.min-percent:2}") double minDiscountPercent,
            @Value("${loyalty.discount.max-percent:20}") double maxDiscountPercent,
            @Value("${loyalty.profit.estimated-margin-percent:28}") double estimatedMarginPercent,
            @Value("${loyalty.profit.min-retained-margin-percent:10}") double minRetainedMarginPercent,
            @Value("${loyalty.profit.max-discount-share-of-profit-percent:50}") double maxDiscountShareOfProfitPercent) {
        this.loyaltyThreshold = loyaltyThreshold;
        this.minDiscountPercent = minDiscountPercent;
        this.maxDiscountPercent = maxDiscountPercent;
        this.estimatedMarginPercent = estimatedMarginPercent;
        this.minRetainedMarginPercent = minRetainedMarginPercent;
        this.maxDiscountShareOfProfitPercent = maxDiscountShareOfProfitPercent;
    }

    public DiscountPrediction predict(double loyaltyScore,
                                      long totalPurchases,
                                      double totalAmountSpent,
                                      double currentAmount,
                                      LocalDateTime lastPurchaseDate,
                                      double originalCost,
                                      String randomSeedKey) {
        String customerSegment = classifySegment(loyaltyScore, totalPurchases);
        double marginBasedMaxDiscountPercent = getProfitSafeMaxDiscountPercent();
        double grossProfitBeforeDiscount = roundMoney(currentAmount - originalCost);
        double profitShareCap = clamp(maxDiscountShareOfProfitPercent, 0.0, 100.0);
        double profitBasedMaxDiscountAmount = roundMoney(
                Math.max(0.0, grossProfitBeforeDiscount * profitShareCap / 100.0)
        );
        double minimumRetainedProfitAmount = roundMoney(
                Math.max(0.0, grossProfitBeforeDiscount - profitBasedMaxDiscountAmount)
        );
        double profitBasedMaxDiscountPercent = roundMoney(
                currentAmount <= 0.0 ? 0.0 : (profitBasedMaxDiscountAmount * 100.0 / currentAmount)
        );
        double effectiveMaxDiscountPercent = Math.min(marginBasedMaxDiscountPercent, profitBasedMaxDiscountPercent);

        if (effectiveMaxDiscountPercent <= 0.0) {
            return buildNoDiscountResult(
                    currentAmount,
                    customerSegment,
                    marginBasedMaxDiscountPercent,
                    profitBasedMaxDiscountPercent,
                    originalCost,
                    minimumRetainedProfitAmount
            );
        }

        double averageTicketAmount = totalPurchases == 0 ? currentAmount : (totalAmountSpent / totalPurchases);
        double loyaltyFeature = clamp((loyaltyScore - loyaltyThreshold) / loyaltyThreshold, 0.0, 3.0);
        double frequencyFeature = clamp(totalPurchases / 25.0, 0.0, 2.0);
        double spendFeature = clamp(totalAmountSpent / 100000.0, 0.0, 2.0);

        double basketLift = averageTicketAmount <= 0.0 ? 1.0 : (currentAmount / averageTicketAmount);
        double basketFeature = clamp(basketLift - 1.0, -0.5, 2.0);
        double basketContribution = basketFeature >= 0 ? basketFeature * 2.2 : basketFeature * 0.8;

        long daysSinceLastPurchase = lastPurchaseDate == null
                ? 999
                : ChronoUnit.DAYS.between(lastPurchaseDate.toLocalDate(), LocalDateTime.now().toLocalDate());
        double recencyContribution = getRecencyContribution(daysSinceLastPurchase);
        double segmentBonus = getSegmentBonus(customerSegment);

        double modelDiscountPercent = minDiscountPercent
                + (loyaltyFeature * 3.5)
                + (frequencyFeature * 2.2)
                + (spendFeature * 1.5)
                + basketContribution
                + recencyContribution
                + segmentBonus;

        double boundedModelDiscount = clamp(modelDiscountPercent, minDiscountPercent, maxDiscountPercent);
        double costSafeDiscountAmount = roundMoney(Math.max(0.0, currentAmount * effectiveMaxDiscountPercent / 100.0));
        double randomDiscountCapAmount = Math.min(RANDOM_DISCOUNT_CAP_AMOUNT, costSafeDiscountAmount);
        if (randomDiscountCapAmount <= 0.0) {
            return buildNoDiscountResult(
                    currentAmount,
                    customerSegment,
                    marginBasedMaxDiscountPercent,
                    profitBasedMaxDiscountPercent,
                    originalCost,
                    minimumRetainedProfitAmount
            );
        }

        double randomFloorAmount = loyaltyScore >= loyaltyThreshold ? 50.0 : 20.0;
        double randomMinAmount = Math.min(randomFloorAmount, randomDiscountCapAmount);
        double discountAmount = roundMoney(deterministicRandomAmount(randomMinAmount, randomDiscountCapAmount, randomSeedKey));
        double discountPercent = currentAmount <= 0.0 ? 0.0 : roundMoney((discountAmount * 100.0) / currentAmount);
        boolean marginGuardApplied = discountPercent + 0.0001 < boundedModelDiscount
                || effectiveMaxDiscountPercent + 0.0001 < marginBasedMaxDiscountPercent
                || effectiveMaxDiscountPercent + 0.0001 < profitBasedMaxDiscountPercent
                || randomDiscountCapAmount + 0.0001 < RANDOM_DISCOUNT_CAP_AMOUNT;

        double finalAmount = roundMoney(Math.max(0.0, currentAmount - discountAmount));
        double netProfitAfterDiscount = roundMoney(finalAmount - originalCost);
        boolean eligibleForDiscount = discountPercent > 0.0;

        return new DiscountPrediction(
                loyaltyThreshold,
                eligibleForDiscount,
                roundMoney(discountPercent),
                discountAmount,
                finalAmount,
                MODEL_VERSION,
                customerSegment,
                roundMoney(marginBasedMaxDiscountPercent),
                marginGuardApplied,
                roundMoney(profitBasedMaxDiscountPercent),
                roundMoney(originalCost),
                grossProfitBeforeDiscount,
                netProfitAfterDiscount,
                minimumRetainedProfitAmount
        );
    }

    private double deterministicRandomAmount(double minAmount, double maxAmount, String seedKey) {
        if (maxAmount <= minAmount) {
            return roundMoney(maxAmount);
        }

        long seed = seedKey == null ? 0L : seedKey.hashCode();
        Random random = new Random(seed * 1103515245L + 12345L);
        return roundMoney(minAmount + (random.nextDouble() * (maxAmount - minAmount)));
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private DiscountPrediction buildNoDiscountResult(double currentAmount,
                                                     String customerSegment,
                                                     double marginBasedMaxDiscountPercent,
                                                     double profitBasedMaxDiscountPercent,
                                                     double originalCost,
                                                     double minimumRetainedProfitAmount) {
        double grossProfitBeforeDiscount = roundMoney(currentAmount - originalCost);
        return new DiscountPrediction(
                loyaltyThreshold,
                false,
                0.0,
                0.0,
                roundMoney(currentAmount),
                MODEL_VERSION,
                customerSegment,
                roundMoney(Math.max(0.0, marginBasedMaxDiscountPercent)),
                false,
                roundMoney(Math.max(0.0, profitBasedMaxDiscountPercent)),
                roundMoney(originalCost),
                grossProfitBeforeDiscount,
                grossProfitBeforeDiscount,
                roundMoney(minimumRetainedProfitAmount)
        );
    }

    private String classifySegment(double loyaltyScore, long totalPurchases) {
        if (loyaltyScore >= loyaltyThreshold * 2.2 || totalPurchases >= 20) {
            return "PLATINUM";
        }
        if (loyaltyScore >= loyaltyThreshold * 1.6 || totalPurchases >= 12) {
            return "GOLD";
        }
        if (loyaltyScore >= loyaltyThreshold || totalPurchases >= 6) {
            return "SILVER";
        }
        return "BRONZE";
    }

    private double getSegmentBonus(String segment) {
        return switch (segment) {
            case "PLATINUM" -> 4.0;
            case "GOLD" -> 2.5;
            case "SILVER" -> 1.0;
            default -> 0.0;
        };
    }

    private double getRecencyContribution(long daysSinceLastPurchase) {
        if (daysSinceLastPurchase <= 15) {
            return 1.2;
        }
        if (daysSinceLastPurchase <= 45) {
            return 0.6;
        }
        if (daysSinceLastPurchase > 120) {
            return 0.8;
        }
        return 0.0;
    }

    private double getProfitSafeMaxDiscountPercent() {
        return Math.max(0.0, Math.min(maxDiscountPercent, estimatedMarginPercent - minRetainedMarginPercent));
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record DiscountPrediction(
            double loyaltyThreshold,
            boolean eligibleForDiscount,
            double discountPercent,
            double discountAmount,
            double finalAmount,
            String modelVersion,
            String customerSegment,
            double profitSafeMaxDiscountPercent,
            boolean marginGuardApplied,
            double profitBasedMaxDiscountPercent,
            double originalCost,
            double grossProfitBeforeDiscount,
            double netProfitAfterDiscount,
            double minimumRetainedProfitAmount
    ) {
    }
}
