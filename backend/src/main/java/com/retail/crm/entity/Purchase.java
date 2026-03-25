package com.retail.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private LocalDateTime purchaseDate = LocalDateTime.now();

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @PrePersist
    void ensureDefaults() {
        if (purchaseDate == null) {
            purchaseDate = LocalDateTime.now();
        }
    }
}
