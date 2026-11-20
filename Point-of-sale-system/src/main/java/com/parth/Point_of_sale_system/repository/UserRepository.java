package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.store WHERE u.email = :email")
    User findByEmail(@Param("email") String email);

}