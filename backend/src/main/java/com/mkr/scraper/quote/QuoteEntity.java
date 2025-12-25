package com.mkr.scraper.quote;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "quotes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class QuoteEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 2048)
    private String text;

    private String author;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quote_tags", joinColumns = @JoinColumn(name = "quote_id"))
    @Column(name = "tag")
    private List<String> tags;

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}

