package com.parth.Point_of_sale_system.exception;

/**
 * Thrown when a product with the same SKU or barcode already exists
 * within the same branch.
 */
public class DuplicateProductException extends RuntimeException {

    public DuplicateProductException(String message) {
        super(message);
    }
}