package com.mkr.scraper.scrape;

import com.mkr.scraper.book.BookEntity;
import com.mkr.scraper.book.BookRepository;
import com.mkr.scraper.quote.QuoteEntity;
import com.mkr.scraper.quote.QuoteRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScrapeService {
    private final BookRepository bookRepository;
    private final QuoteRepository quoteRepository;

    public ScrapeService(BookRepository bookRepository, QuoteRepository quoteRepository) {
        this.bookRepository = bookRepository;
        this.quoteRepository = quoteRepository;
    }

    @Transactional
    public void scrapeBooks() throws IOException {
        String baseUrl = "https://books.toscrape.com/";
        String startUrl = baseUrl + "index.html";
        List<BookEntity> books = new ArrayList<>();

        String url = startUrl;
        while (url != null) {
            Document doc = Jsoup.connect(url).get();
            Elements articles = doc.select("section div ol.row li article.product_pod");
            for (Element article : articles) {
                BookEntity book = new BookEntity();
                // Image
                String imgSrc = article.selectFirst("div.image_container a img").attr("src");
                if (imgSrc != null && !imgSrc.isEmpty()) {
                    String normalized = imgSrc.replace("../", "");
                    book.setImageUrl(baseUrl + normalized);
                }
                // Rating from class "star-rating Three" etc.
                Element ratingEl = article.selectFirst("p.star-rating");
                String rating = ratingEl != null ? ratingEl.className().replace("star-rating", "").trim() : null;
                book.setRating(rating);
                // Title
                String title = article.selectFirst("h3 a").attr("title");
                book.setTitle(title);
                // Price
                String priceText = article.selectFirst("div.product_price p.price_color").text();
                // e.g. "£51.77" -> 51.77
                String numeric = priceText.replaceAll("[^0-9.]", "");
                if (!numeric.isEmpty()) {
                    book.setPrice(new BigDecimal(numeric));
                }
                books.add(book);
            }
            // Next page
            Element next = doc.selectFirst("li.next a");
            if (next != null) {
                String href = next.attr("href");
                if (href.startsWith("catalogue")) {
                    url = baseUrl + href;
                } else if (href.startsWith("page")) {
                    url = baseUrl + "catalogue/" + href;
                } else {
                    url = baseUrl + href;
                }
            } else {
                url = null;
            }
        }
        // Simple strategy: clear and insert fresh snapshot
        bookRepository.deleteAllInBatch();
        bookRepository.saveAll(books);
    }

    @Transactional
    public void scrapeQuotes() throws IOException {
        String baseUrl = "https://quotes.toscrape.com/";
        String startUrl = baseUrl;
        List<QuoteEntity> quotes = new ArrayList<>();

        String url = startUrl;
        while (url != null) {
            Document doc = Jsoup.connect(url).get();
            Elements quoteEls = doc.select("div.quote");
            for (Element q : quoteEls) {
                QuoteEntity qe = new QuoteEntity();
                qe.setText(q.selectFirst("span.text").text());
                qe.setAuthor(q.selectFirst("small.author").text());
                List<String> tags = new ArrayList<>();
                for (Element tagEl : q.select("div.tags a.tag")) {
                    tags.add(tagEl.text());
                }
                qe.setTags(tags);
                quotes.add(qe);
            }
            Element next = doc.selectFirst("li.next a");
            if (next != null) {
                String href = next.attr("href");
                url = baseUrl + href;
            } else {
                url = null;
            }
        }
        quoteRepository.deleteAllInBatch();
        quoteRepository.saveAll(quotes);
    }
}

