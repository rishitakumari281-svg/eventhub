package com.eventhub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String slug;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 120)
    private String blurb;

    protected Category() {}

    public Category(String slug, String name, String blurb) {
        this.slug = slug;
        this.name = name;
        this.blurb = blurb;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getBlurb() { return blurb; }
}
