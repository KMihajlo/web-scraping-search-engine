package com.mkr.scraper.scrape;

import com.mkr.scraper.book.BookRepository;
import com.mkr.scraper.quote.QuoteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ScrapeServiceTest {
    @Autowired
    ScrapeService scrapeService;
    @Autowired
    BookRepository bookRepository;
    @Autowired
    QuoteRepository quoteRepository;

    @Test
    void scrapeBooksAndQuotes() throws Exception {
        scrapeService.scrapeBooks();
        scrapeService.scrapeQuotes();
        assertTrue(bookRepository.count() > 0, "Books should be scraped");
        assertTrue(quoteRepository.count() > 0, "Quotes should be scraped");
    }
}

