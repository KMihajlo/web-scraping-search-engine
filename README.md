# Web Scraping Search Engine (Backend)

Spring Boot (Java 21) backend that scrapes Books and Quotes from public demo sites using Jsoup, stores results in H2, and exposes REST endpoints for a frontend.

- Books source: https://books.toscrape.com/
- Quotes source: https://quotes.toscrape.com/
- Persistence: H2 (in-memory)
- Scheduler: initial scrape on startup, then daily at 2AM CET (Europe/Belgrade)

## Tech
- Java 21
- Spring Boot 3.4.x (Web, Data JPA, Validation)
- Jsoup 1.17.x
- H2
- Maven

## Endpoints
- GET `/api/scrapedBooks` → List of books: imageUrl, rating, title, price
- GET `/api/scrapedQuotes` → List of quotes: text, author, tags
- H2 Console: `/h2-console` (JDBC URL `jdbc:h2:mem:scraperdb`, user `sa`, no password)

## Run locally

Prerequisites: Java 21 and Maven installed (or use the Maven wrapper if added later).

Build and run tests:

```zsh
cd /Users/mihajlo.kragujevski/Desktop/Projects/personal/web-scraping-search-engine
mvn -DskipTests=false clean test
```

Start the app:

```zsh
mvn spring-boot:run
```

The app will:
- Perform an initial scrape on startup (first run may take ~10–20s).
- Expose REST endpoints on `http://localhost:8080`.

Quick smoke test (after startup):

```zsh
curl -s http://localhost:8080/api/scrapedBooks | head -n 20
curl -s http://localhost:8080/api/scrapedQuotes | head -n 20
```

Open H2 Console in a browser: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:scraperdb`
- User: `sa`
- Password: (leave blank)

## Notes
- Scheduler runs daily at 02:00 CET: `@Scheduled(cron = "0 0 2 * * *", zone = "Europe/Belgrade")`.
- Scraping normalizes relative image URLs on books.toscrape to absolute URLs.
- Snapshot strategy: tables are cleared (`deleteAllInBatch`) before inserting fresh results on each scrape.

## Next (Frontend)
When you’re ready, we’ll scaffold a React app to consume these endpoints, display results, and add client-side search/filter (e.g., type "harry potter" to filter books by title).

