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

    private static String truncateWithEllipsis(String s, int max) {
        if (s == null) return null;
        if (s.length() <= max) return s;
        if (max <= 3) return s.substring(0, Math.max(0, max));
        return s.substring(0, max - 3) + "...";
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
                String numeric = priceText.replaceAll("[^0-9.]", "");
                if (!numeric.isEmpty()) {
                    book.setPrice(new BigDecimal(numeric));
                }
                // Product URL (details page)
                String href = article.selectFirst("h3 a").attr("href");
                String productUrl;
                if (href.startsWith("catalogue")) {
                    productUrl = baseUrl + href;
                } else {
                    productUrl = baseUrl + "catalogue/" + href;
                }
                // Normalize possible ../
                productUrl = productUrl.replace("../", "");
                book.setProductUrl(productUrl);

                // Fetch product page for category & details
                try {
                    Document pd = Jsoup.connect(productUrl).get();
                    // Category from breadcrumb: Home > Books > Category
                    Element breadcrumbCat = pd.selectFirst("ul.breadcrumb li:nth-child(3) a");
                    if (breadcrumbCat != null) {
                        book.setCategory(breadcrumbCat.text());
                    }
                    // Description (if present)
                    Element descHeader = pd.selectFirst("#product_description");
                    if (descHeader != null) {
                        Element descPara = descHeader.nextElementSibling();
                        if (descPara != null) {
                            String desc = descPara.text();
                            // Truncate to a generous limit to avoid DB issues in stricter envs
                            book.setDescription(truncateWithEllipsis(desc, 16000));
                        }
                    }
                    // Availability
                    Element avail = pd.selectFirst("table.table.table-striped tr:contains(Availability) td");
                    if (avail != null) book.setAvailability(avail.text());
                    // UPC
                    Element upcEl = pd.selectFirst("table.table.table-striped tr:contains(UPC) td");
                    if (upcEl != null) book.setUpc(upcEl.text());
                    // Product Type
                    Element typeEl = pd.selectFirst("table.table.table-striped tr:contains(Product Type) td");
                    if (typeEl != null) book.setProductType(typeEl.text());
                    // Prices & Tax
                    Element exclEl = pd.selectFirst("table.table.table-striped tr:contains(Price (excl. tax)) td");
                    if (exclEl != null) {
                        String n = exclEl.text().replaceAll("[^0-9.]", "");
                        if (!n.isEmpty()) book.setPriceExclTax(new BigDecimal(n));
                    }
                    Element inclEl = pd.selectFirst("table.table.table-striped tr:contains(Price (incl. tax)) td");
                    if (inclEl != null) {
                        String n = inclEl.text().replaceAll("[^0-9.]", "");
                        if (!n.isEmpty()) book.setPriceInclTax(new BigDecimal(n));
                    }
                    Element taxEl = pd.selectFirst("table.table.table-striped tr:contains(Tax) td");
                    if (taxEl != null) {
                        String n = taxEl.text().replaceAll("[^0-9.]", "");
                        if (!n.isEmpty()) book.setTax(new BigDecimal(n));
                    }
                    // Number of reviews
                    Element reviewsEl = pd.selectFirst("table.table.table-striped tr:contains(Number of reviews) td");
                    if (reviewsEl != null) {
                        try {
                            book.setNumberOfReviews(Integer.parseInt(reviewsEl.text().trim()));
                        } catch (NumberFormatException ignored) {}
                    }
                } catch (IOException ignored) {
                    // continue without details if product page fails
                }

                books.add(book);
            }
            // Next page
            Element next = doc.selectFirst("li.next a");
            if (next != null) {
                String nhref = next.attr("href");
                if (nhref.startsWith("catalogue")) {
                    url = baseUrl + nhref;
                } else if (nhref.startsWith("page")) {
                    url = baseUrl + "catalogue/" + nhref;
                } else {
                    url = baseUrl + nhref;
                }
                url = url.replace("../", "");
            } else {
                url = null;
            }
        }
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
