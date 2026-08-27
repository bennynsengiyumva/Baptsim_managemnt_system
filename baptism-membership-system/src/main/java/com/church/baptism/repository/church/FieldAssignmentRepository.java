package com.church.baptism.repository.church;

import com.church.baptism.entity.church.FieldAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface FieldAssignmentRepository extends JpaRepository<FieldAssignment, Long> {
    List<FieldAssignment> findByFieldIdAndStatus(Long fieldId, FieldAssignment.AssignmentStatus status);
    Optional<FieldAssignment> findByHeadIdAndStatus(Long headId, FieldAssignment.AssignmentStatus status);
    List<FieldAssignment> findByFieldIdOrderByStartDateDesc(Long fieldId);
    List<FieldAssignment> findByHeadIdOrderByStartDateDesc(Long headId);

    @Query("SELECT fa FROM FieldAssignment fa WHERE fa.status = 'ACTIVE' AND fa.field.union.id = :unionId")
    List<FieldAssignment> findActiveByUnionId(@Param("unionId") Long unionId);
}
