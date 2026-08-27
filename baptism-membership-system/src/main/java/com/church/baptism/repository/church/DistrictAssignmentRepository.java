package com.church.baptism.repository.church;

import com.church.baptism.entity.church.DistrictAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DistrictAssignmentRepository extends JpaRepository<DistrictAssignment, Long> {
    List<DistrictAssignment> findByDistrictIdAndStatus(Long districtId, DistrictAssignment.AssignmentStatus status);
    Optional<DistrictAssignment> findByPastorIdAndStatus(Long pastorId, DistrictAssignment.AssignmentStatus status);
    List<DistrictAssignment> findByDistrictIdOrderByStartDateDesc(Long districtId);
    List<DistrictAssignment> findByPastorIdOrderByStartDateDesc(Long pastorId);

    @Query("SELECT da FROM DistrictAssignment da WHERE da.status = 'ACTIVE' AND da.district.field.id = :fieldId")
    List<DistrictAssignment> findActiveByFieldId(@Param("fieldId") Long fieldId);

    @Query("SELECT da FROM DistrictAssignment da WHERE da.status = 'ACTIVE' AND da.district.field.union.id = :unionId")
    List<DistrictAssignment> findActiveByUnionId(@Param("unionId") Long unionId);
}
