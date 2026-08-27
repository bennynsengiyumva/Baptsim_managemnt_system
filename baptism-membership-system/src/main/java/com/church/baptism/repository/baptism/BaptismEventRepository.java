package com.church.baptism.repository.baptism;

import com.church.baptism.entity.baptism.BaptismEvent;
import com.church.baptism.entity.baptism.BaptismEvent.BaptismEventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BaptismEventRepository extends JpaRepository<BaptismEvent, Long> {
    List<BaptismEvent> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate date);
    List<BaptismEvent> findByEventDateAfterOrderByEventDateAsc(LocalDate date);
    List<BaptismEvent> findByStatusOrderByEventDateDesc(BaptismEventStatus status);
    List<BaptismEvent> findAllByOrderByEventDateDesc();
}
