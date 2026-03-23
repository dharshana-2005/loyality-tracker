package com.retail.crm.repository;

import com.retail.crm.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByCustomer_Id(Long customerId);
}
