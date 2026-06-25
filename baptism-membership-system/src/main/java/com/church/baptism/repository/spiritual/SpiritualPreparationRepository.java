package com.church.baptism.repository.spiritual;

import com.church.baptism.entity.spiritual.SpiritualPreparation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpiritualPreparationRepository extends JpaRepository<SpiritualPreparation, Long> {

    List<SpiritualPreparation> findByCandidateId(Long candidateId);
}