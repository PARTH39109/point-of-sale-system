package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.BranchSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchSettingsRepository extends JpaRepository<BranchSettings, Long> {
    Optional<BranchSettings> findByBranchId(Long branchId);
}
