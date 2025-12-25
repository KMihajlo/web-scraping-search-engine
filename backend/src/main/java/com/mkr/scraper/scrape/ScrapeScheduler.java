package com.mkr.scraper.scrape;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@Component
public class ScrapeScheduler {
    private static final Logger log = LoggerFactory.getLogger(ScrapeScheduler.class);
    private final ScrapeService scrapeService;

    public ScrapeScheduler(ScrapeService scrapeService) {
        this.scrapeService = scrapeService;
    }

    // Initial scrape on app ready
    @EventListener(ApplicationReadyEvent.class)
    public void initialScrape() {
        try {
            log.info("Initial scrape started");
            scrapeService.scrapeBooks();
            scrapeService.scrapeQuotes();
            log.info("Initial scrape finished");
        } catch (Exception e) {
            log.error("Initial scrape failed", e);
        }
    }

    // Daily at 2AM CET
    @Scheduled(cron = "0 0 2 * * *", zone = "Europe/Belgrade")
    public void dailyScrape() {
        try {
            log.info("Daily scrape started (2AM CET)");
            scrapeService.scrapeBooks();
            scrapeService.scrapeQuotes();
            log.info("Daily scrape finished");
        } catch (Exception e) {
            log.error("Daily scrape failed", e);
        }
    }
}

