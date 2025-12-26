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
    private String rating; // e.g., "Three"
    private String title;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    // New: category/genre
    private String category;

    // New: product page URL for deep details
    @Column(length = 512)
    private String productUrl;

    // New: detailed fields
    @Lob
    @Column(columnDefinition = "CLOB")
    private String description;

    @Column(length = 256)
    private String availability;

    private String upc;

    @Column(name = "product_type")
    private String productType;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceExclTax;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceInclTax;

    @Column(precision = 10, scale = 2)
    private BigDecimal tax;

    @Column(name = "num_reviews")
    private Integer numberOfReviews;

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
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getProductUrl() { return productUrl; }
    public void setProductUrl(String productUrl) { this.productUrl = productUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public String getUpc() { return upc; }
    public void setUpc(String upc) { this.upc = upc; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public BigDecimal getPriceExclTax() { return priceExclTax; }
    public void setPriceExclTax(BigDecimal priceExclTax) { this.priceExclTax = priceExclTax; }
    public BigDecimal getPriceInclTax() { return priceInclTax; }
    public void setPriceInclTax(BigDecimal priceInclTax) { this.priceInclTax = priceInclTax; }
    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    public Integer getNumberOfReviews() { return numberOfReviews; }
    public void setNumberOfReviews(Integer numberOfReviews) { this.numberOfReviews = numberOfReviews; }
}
