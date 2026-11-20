package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;

import java.util.List;

public interface UserService {

    User getUserfromJwtToken(String token) throws UserException;
    User getCurrentUser() throws UserException;
    User getUserByEmail(String email) throws UserException;
    User getUserById(Long id) throws UserException, Exception;
    List<User> getAllUsers();

    Store resolveStoreForUser(User user) throws UserException;

}
