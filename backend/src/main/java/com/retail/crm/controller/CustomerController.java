package com.retail.crm.controller;

import com.retail.crm.dto.CustomerSummary;
import com.retail.crm.entity.Customer;
import com.retail.crm.service.CustomerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@CrossOrigin
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public Customer addCustomer(@RequestBody Customer customer) {
        return customerService.addCustomer(customer);
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }
    @GetMapping("/{id}/summary")
    public CustomerSummary getSummary(@PathVariable Long id) {
        return customerService.getCustomerSummary(id);
    }
}