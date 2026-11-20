package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store,Long> {

    Store findByStoreAdminId(Long adminId);


}
