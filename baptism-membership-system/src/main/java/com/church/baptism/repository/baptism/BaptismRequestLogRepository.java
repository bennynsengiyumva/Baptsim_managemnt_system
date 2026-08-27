package com.church.baptism.repository.baptism;

import com.church.baptism.entity.baptism.BaptismRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BaptismRequestLogRepository extends JpaRepository<BaptismRequestLog, Long> {
    List<BaptismRequestLog> findByRequestIdOrderByTimestampDesc(Long requestId);
    List<BaptismRequestLog> findAllByOrderByTimestampDesc();
}
