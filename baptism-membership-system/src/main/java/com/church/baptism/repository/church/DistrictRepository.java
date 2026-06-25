package com.church.baptism.repository.church;

import com.church.baptism.entity.church.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findByFieldId(Long fieldId);
}
