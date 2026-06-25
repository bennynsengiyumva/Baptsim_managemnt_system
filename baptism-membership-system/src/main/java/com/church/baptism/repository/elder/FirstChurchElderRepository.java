package com.church.baptism.repository.elder;

import com.church.baptism.entity.elder.FirstChurchElder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FirstChurchElderRepository extends JpaRepository<FirstChurchElder, Long> {
    Optional<FirstChurchElder> findByEmail(String email);
    boolean existsByEmail(String email);
    List<FirstChurchElder> findByChurchId(Long churchId);
}
