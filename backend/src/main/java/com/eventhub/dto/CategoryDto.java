package com.eventhub.dto;

import com.eventhub.entity.Category;

public record CategoryDto(String id, String name, String blurb) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getSlug(), c.getName(), c.getBlurb());
    }
}
