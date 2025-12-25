package com.mkr.scraper.quote;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<QuoteEntity, Long> {
}

