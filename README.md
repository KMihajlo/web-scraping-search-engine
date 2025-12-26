# Web Scraping Search Engine (Backend + Frontend)

A full-stack learning project that scrapes Books and Quotes from public demo sites, stores results in H2, and serves a modern search UI.

- Books source: https://books.toscrape.com/
- Quotes source: https://quotes.toscrape.com/

## Stack
- Backend: Java 21, Spring Boot 3.4.x (Web, Data JPA, Validation), Jsoup, H2, Maven
- Frontend: Next.js 14 (TypeScript), SCSS modules

## Project structure
```
web-scraping-search-engine/
├─ backend/                # Spring Boot backend (module)
│  ├─ pom.xml
│  └─ src/main/java/com/mkr/scraper/...
└─ frontend/               # Next.js frontend (module)
   ├─ package.json
   ├─ pages/               # index.tsx orchestrates Books/Quotes
   ├─ components/          # BooksView.tsx, QuotesView.tsx (list UIs)
   └─ styles/              # Home.module.scss + globals.scss
```

---

## Backend
Spring Boot backend that scrapes books and quotes with Jsoup, stores them in H2, and exposes REST endpoints.

### Features
- Initial scrape on startup, then daily at 2AM CET (Europe/Belgrade)
- Books scraped fields: imageUrl, rating, title, price; later expanded with:
  - category/genre
  - description (long text handling: clamp/truncate client-side; backend column sized to accommodate common cases)
  - availability
  - product details (UPC, Product Type, price incl/excl tax, tax, number of reviews)
- Quotes scraped fields: text, author, tags
- Snapshot strategy: clear tables on each run and insert fresh results

### Endpoints
- GET `/api/scrapedBooks` → List of books
- GET `/api/scrapedQuotes` → List of quotes
- H2 Console: `/h2-console`
  - JDBC URL: `jdbc:h2:mem:scraperdb`
  - User: `sa`, Password: (blank)

### Run backend locally
Prerequisites: Java 21 and Maven.

```zsh
cd /Users/mihajlo.kragujevski/Desktop/Projects/personal/web-scraping-search-engine/backend
mvn clean test
mvn spring-boot:run
```

The app will perform an initial scrape and start on `http://localhost:8080`.

Smoke test:
```zsh
curl -s http://localhost:8080/api/scrapedBooks | head -n 20
curl -s http://localhost:8080/api/scrapedQuotes | head -n 20
```

---

## Frontend
Next.js + TypeScript + SCSS modules, a single-page UI that toggles between Books and Quotes.

### Features
- Mode toggle (Books / Quotes). Default is none; shows helpful placeholder.
- Client-side search:
  - Books: search by title and category/genre (clickable category chip)
  - Quotes: search by text, author, and tags (clickable tags)
- Pagination:
  - Dynamic numbered window with ellipses and Prev/Next
  - Mobile-friendly (fewer numbers; buttons don’t escape the viewport)
- Cards:
  - Books: 4 columns desktop, responsive down to 1 column on XS
  - Quotes: 1 column list (more readable)
- Modals:
  - Quotes: modal with enlarged text, tags; Related Quotes (fixed-height cards with ellipsis on overflow)
  - Books: modal top section (image left; title, price, availability, rating right), description section, details grid, Related Books (smaller cards with image + title)
  - Sticky close (×) button at top-right with subtle background, always visible while scrolling
- Rating visuals: 5 stars shown; only rated amount colored (cards + modal)
- Responsive design breakpoints: XL >1440, L ≤1440 >1024, M ≤1024 >768, S ≤768 >480, XS ≤480

### Run frontend locally
Prerequisite: Node.js LTS.

```zsh
cd /Users/mihajlo.kragujevski/Desktop/Projects/personal/web-scraping-search-engine/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.
- Click Books or Quotes and start typing to filter.
- Click a card to open its modal.

### Build
```zsh
cd /Users/mihajlo.kragujevski/Desktop/Projects/personal/web-scraping-search-engine/frontend
npx next build && npx next start
```

---

## Design & UX notes
- Pagination window shifts based on selected page; shows leading/trailing ellipses appropriately.
- Quotes related cards clamp to ~5 lines; show “…” only when the text overflows.
- Book related cards are compact (image + title) and not fixed height.
- Modal close button is sticky, aligned top-right, within modal padding and readable over content.

---

## Troubleshooting
- IDE shows imports/annotations not resolving: ensure you opened the `backend` module as a Maven project. The root pom has been removed; only `backend/pom.xml` is used.
- If H2 description length errors occur: increase column size for `description` in the entity or clamp on client-side (current frontend clamps long descriptions; backend stores common lengths).
- Git: do not commit build artifacts (e.g., `backend/target/`, `frontend/.next/`). Use `.gitignore` to exclude them.
- Multiple GitHub accounts causing push 403: configure your credential helper and remote with the correct user.

---

## Roadmap
- Backend: add more sources, incremental updates instead of full snapshot, error handling/reporting.
- Frontend: shared utilities for pagination/rating, modal accessibility (focus trap, ESC), server-side search (optional), theming.
- Deployment: containerize backend, add CI, deploy frontend.

---

## License
Educational/demo project. Use responsibly and obey the target sites’ terms.
