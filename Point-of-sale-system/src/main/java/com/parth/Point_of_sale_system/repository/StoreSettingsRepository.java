package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
    Optional<StoreSettings> findByStoreId(Long storeId);
}
