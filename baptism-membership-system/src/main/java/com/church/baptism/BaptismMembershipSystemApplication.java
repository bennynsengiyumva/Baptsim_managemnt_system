package com.church.baptism;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.church.baptism")
public class BaptismMembershipSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(BaptismMembershipSystemApplication.class, args);
    }
}