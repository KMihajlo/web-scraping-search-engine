package com.mkr.scraper.book;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "books")
public class BookEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;
    private String rating; // store as text like "Three" or numeric stars depending on scrape
    private String title;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}

