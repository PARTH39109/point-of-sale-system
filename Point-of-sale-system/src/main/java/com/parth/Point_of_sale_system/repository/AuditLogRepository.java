package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByStoreIdOrderByTimestampDesc(Long storeId);
}
