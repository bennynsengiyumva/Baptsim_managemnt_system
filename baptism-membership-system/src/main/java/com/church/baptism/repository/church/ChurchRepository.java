package com.church.baptism.repository.church;

import com.church.baptism.entity.church.Church;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChurchRepository
        extends JpaRepository<Church, Long> {
    List<Church> findByDistrictId(Long districtId);
}
