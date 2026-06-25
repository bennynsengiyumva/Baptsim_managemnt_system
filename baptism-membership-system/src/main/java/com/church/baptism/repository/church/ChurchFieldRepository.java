package com.church.baptism.repository.church;

import com.church.baptism.entity.church.ChurchField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChurchFieldRepository extends JpaRepository<ChurchField, Long> {
    List<ChurchField> findByUnionId(Long unionId);
}
