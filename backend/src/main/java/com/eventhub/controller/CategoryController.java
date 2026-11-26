package com.eventhub.controller;

import com.eventhub.dto.CategoryDto;
import com.eventhub.repository.CategoryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryRepository categories;

    public CategoryController(CategoryRepository categories) { this.categories = categories; }

    @GetMapping
    public List<CategoryDto> list() {
        return categories.findAll().stream().map(CategoryDto::from).toList();
    }
}
