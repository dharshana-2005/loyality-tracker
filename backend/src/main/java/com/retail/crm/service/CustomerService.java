package com.retail.crm.service;

import com.retail.crm.dto.CustomerSummary;
import com.retail.crm.entity.Customer;
import com.retail.crm.entity.Purchase;
import com.retail.crm.repository.CustomerRepository;
import com.retail.crm.repository.PurchaseRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PurchaseRepository purchaseRepository;
    private final double loyaltyThreshold;

    public CustomerService(CustomerRepository customerRepository,
                           PurchaseRepository purchaseRepository,
                           @Value("${loyalty.discount.threshold:500}") double loyaltyThreshold) {
        this.customerRepository = customerRepository;
        this.purchaseRepository = purchaseRepository;
        this.loyaltyThreshold = loyaltyThreshold;
    }

    public Customer addCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public CustomerSummary getCustomerSummary(Long customerId) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        List<Purchase> purchases = purchaseRepository.findByCustomer_Id(customerId);

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
        boolean eligibleForDiscount = loyaltyScore >= loyaltyThreshold;

        return new CustomerSummary(
                totalPurchases,
                totalAmountSpent,
                loyaltyScore,
                loyaltyThreshold,
                eligibleForDiscount,
                lastPurchaseDate
        );
    }
}
