package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.ProductDto;

import java.util.List;

public interface ProductService {

    ProductDto createProduct(ProductDto productDto, User user);
    ProductDto updateProduct(Long id,ProductDto productDto, User user);

    void deleteProduct(Long id,User user);
    List<ProductDto> getProductByStoreId(Long storeId);
    List<ProductDto> getProducts(User user);
    List<ProductDto> searchByKeyword(Long storeId,String keyword);
    List<ProductDto> searchProducts(User user, String keyword);


}
