import { useEffect, useMemo, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.scss';
import React from 'react';

// Types
export type Book = {
  id?: number;
  imageUrl: string;
  rating: number | string;
  title: string;
  price: string | number;
  category?: string;
  productUrl?: string;
  description?: string;
  availability?: string;
  upc?: string;
  productType?: string;
  priceExclTax?: number | string;
  priceInclTax?: number | string;
  tax?: number | string;
  numberOfReviews?: number;
};

export type Quote = {
  id?: number;
  text: string;
  author: string;
  tags: string[];
};

type Mode = 'none' | 'books' | 'quotes';

// Map rating text (e.g., "Three") to numeric 1..5
const ratingToNumber = (r: string | number | undefined): number => {
  if (typeof r === 'number') return Math.max(0, Math.min(5, Math.round(r)));
  if (!r) return 0;
  const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  const n = map[String(r).trim().toLowerCase()];
  return n ?? 0;
};

const renderStars = (r: string | number | undefined, size: 'sm' | 'lg' = 'sm') => {
  const n = ratingToNumber(r);
  return (
    <div className={`${styles.stars} ${size === 'lg' ? styles.lg : ''}`} aria-label={`Rating: ${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`${styles.star} ${i < n ? styles.filled : ''}`}>★</span>
      ))}
    </div>
  );
};

// Page sizes for pagination
const PAGE_SIZES = {
  books: 20,
  quotes: 20
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('none');
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [showModalQuote, setShowModalQuote] = useState<Quote | null>(null);
  const [showModalBook, setShowModalBook] = useState<Book | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | ''>('');
  const [hideHeader, setHideHeader] = useState(false);
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    // Fetch initial data when mode changes
    const fetchData = async () => {
      try {
        if (mode === 'books') {
          const res = await fetch('http://localhost:8080/api/scrapedBooks');
          const data: Book[] = await res.json();
          setBooks(data);
          setPage(1);
        } else if (mode === 'quotes') {
          const res = await fetch('http://localhost:8080/api/scrapedQuotes');
          const data: Quote[] = await res.json();
          setQuotes(data);
          setPage(1);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [mode]);

  useEffect(() => {
    setPage(1); // reset page on query change
  }, [query]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.category ? b.category.toLowerCase().includes(q) : false)
    );
  }, [books, query]);

  const filteredQuotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(qt =>
      qt.text.toLowerCase().includes(q) ||
      qt.author.toLowerCase().includes(q) ||
      qt.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [quotes, query]);

  const pageSize = mode === 'books' ? PAGE_SIZES.books : PAGE_SIZES.quotes;
  const totalItems = mode === 'books' ? filteredBooks.length : filteredQuotes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    if (mode === 'books') return filteredBooks.slice(start, end);
    if (mode === 'quotes') return filteredQuotes.slice(start, end);
    return [];
  }, [filteredBooks, filteredQuotes, page, pageSize, mode]);

  // Compute dynamic numbered pagination: first, window around current page, last, with ellipses
  const paginationNumbers = useMemo(() => {
    type Item = number | 'ellipsis';
    const items: Item[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    const windowSize = isMobile ? 3 : 5;
    let start = page - Math.floor(windowSize / 2);
    let end = page + Math.floor(windowSize / 2);
    if (windowSize % 2 === 0) end -= 1; // ensure consistent count on even sizes

    if (start < 2) {
      start = 2;
      end = start + windowSize - 1;
    }
    if (end > totalPages - 1) {
      end = totalPages - 1;
      start = end - windowSize + 1;
    }

    items.push(1);
    if (start > 2) items.push('ellipsis');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);

    return items;
  }, [page, totalPages, isMobile]);

  const pagedBooks: Book[] = mode === 'books' ? (pagedItems as Book[]) : [];
  const pagedQuotes: Quote[] = mode === 'quotes' ? (pagedItems as Quote[]) : [];

  const onTagClick = (tag: string) => {
    setMode('quotes');
    setQuery(tag);
  };

  function RelatedQuoteCard({ quote, onClick }: { quote: Quote; onClick: () => void }) {
    const textRef = useRef<HTMLDivElement | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      const el = textRef.current;
      if (!el) return;
      // Defer check to after paint
      const id = requestAnimationFrame(() => {
        const truncated = el.scrollHeight > el.clientHeight + 1; // tolerance
        setIsTruncated(truncated);
      });
      return () => cancelAnimationFrame(id);
    }, []);

    return (
      <div className={styles.relatedCard} onClick={onClick}>
        <div ref={textRef} className={`${styles.quoteText} ${isTruncated ? styles.truncated : ''}`}>“{quote.text}”</div>
        <div className={styles.quoteAuthor}>— {quote.author}</div>
      </div>
    );
  }

  useEffect(() => {
    // initialize theme from localStorage or system preference
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null;
    let initial: 'light' | 'dark';
    if (saved) {
      initial = saved;
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      initial = prefersLight ? 'light' : 'dark';
    }
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > scrollPosRef.current && y > 50) {
        // scrolling down
        setHideHeader(true);
      } else {
        // scrolling up
        setHideHeader(false);
      }
      scrollPosRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const isOpen = Boolean(showModalBook || showModalQuote);
    if (isOpen) {
      const scrollY = window.scrollY || window.pageYOffset;
      html.classList.add('modal-open');
      body.classList.add('modal-open');
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    } else {
      const top = body.style.top;
      html.classList.remove('modal-open');
      body.classList.remove('modal-open');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      if (top) {
        const y = parseInt(top || '0', 10) * -1;
        window.scrollTo(0, y);
      }
    }
    return () => {
      const top = body.style.top;
      html.classList.remove('modal-open');
      body.classList.remove('modal-open');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      if (top) {
        const y = parseInt(top || '0', 10) * -1;
        window.scrollTo(0, y);
      }
    };
  }, [showModalBook, showModalQuote]);

  return (
    <>
      <Head>
        <title>Web Scraping Search Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header block with title + controls, hide/show on scroll */}
      <header className={`${styles.header} ${hideHeader ? styles.headerHidden : ''}`}>
        <div className={styles.headerInner}>
          <div className={styles.headerTitle}>Web Scraping Search Engine</div>
          <div className={styles.controls}>
            <label className={styles.themeSwitch}>
              <input
                type="checkbox"
                className={styles.themeSwitchInput}
                checked={theme === 'light'}
                onChange={toggleTheme}
                aria-label="Toggle light/dark theme"
              />
              <span className={styles.switch}>
                <span className={styles.switchKnob} />
              </span>
              <span className={styles.themeSwitchLabel}>{theme === 'light' ? 'Light' : 'Dark'}</span>
            </label>
            <button
                className={`${styles.toggle} ${mode === 'books' ? styles.active : ''}`}
                onClick={() => setMode(mode === 'books' ? 'none' : 'books')}
                aria-pressed={mode === 'books'}
            >
              <span className="transition"></span>
              <span className="gradient"></span>
              <span className="label">Books</span>
            </button>
            <button
                className={`${styles.toggle} ${mode === 'quotes' ? styles.active : ''}`}
              onClick={() => setMode(mode === 'quotes' ? 'none' : 'quotes')}
              aria-pressed={mode === 'quotes'}
            >
              <span className="transition"></span>
              <span className="gradient"></span>
              <span className="label">Quotes</span>
            </button>

            <input
              className={styles.search}
              placeholder={
                mode === 'books'
                  ? 'Try searching for a book title or category'
                  : mode === 'quotes'
                    ? 'Try searching a quote, author or a tag'
                    : 'Select Books or Quotes to start searching'
              }
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={mode === 'none'}
            />
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {mode !== 'none' && (
          <div className={styles.resultCount}>
            {totalItems} results
          </div>
        )}

        {mode === 'none' && (
          <div className={styles.placeholder}>
            Select Books or Quotes to start searching.
          </div>
        )}

        {mode === 'books' && (
          <div className={styles.gridBooks}>
            {pagedBooks.length === 0 ? (
              <div className={styles.empty}>No books found. Try a different keyword.</div>
            ) : (
              pagedBooks.map((b, idx) => (
                <div key={`${b.title}-${idx}`} className={styles.bookCard} onClick={() => setShowModalBook(b)}>
                  <div className={styles.bookImageWrap}>
                    <img src={String(b.imageUrl)} alt={b.title} className={styles.bookImage} />
                    <div className={styles.rating}>{renderStars(b.rating, 'sm')}</div>
                  </div>
                  <div className={styles.bookInfo}>
                    <div className={styles.bookTitle}>{b.title}</div>
                    <div className={styles.bookMeta}>
                      <span className={styles.bookPrice}>{typeof b.price === 'number' ? `£${b.price}` : b.price}</span>
                      {b.category && (
                        <button className={`${styles.tag} ${styles.bookTag}`} onClick={(e) => { e.stopPropagation(); setMode('books'); setQuery(b.category!); }}>
                          {b.category.charAt(0).toUpperCase() + b.category.slice(1)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'quotes' && (
          <div className={styles.gridQuotes}>
            {pagedQuotes.length === 0 ? (
              <div className={styles.empty}>No quotes found. Try a different keyword.</div>
            ) : (
              pagedQuotes.map((qt, idx) => (
                <div key={`${qt.text.slice(0,20)}-${idx}`} className={styles.quoteCard} onClick={() => setShowModalQuote(qt)}>
                  <div className={styles.quoteText}>“{qt.text}”</div>
                  <div className={styles.quoteAuthor}>— {qt.author}</div>
                  <div className={styles.tags}>
                    {qt.tags.map(tag => (
                      <button key={tag} className={`${styles.tag} ${styles.quoteTag}`} onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode !== 'none' && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <div className={styles.pageNumbers}>
              {paginationNumbers.map((n, idx) => {
                if (n === 'ellipsis') {
                  return <span key={`el-${idx}`} className={styles.ellipsis}>…</span>;
                }
                const isActive = n === page;
                return (
                  <button
                    key={`pg-${n}`}
                    className={`${styles.pageNumber} ${isActive ? styles.pageActive : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Footer below pagination */}
        <footer className={styles.footer}>
          <span className={styles.footerText}>Made by: Mihajlo Kragujevski</span>
          <a
            className={styles.footerLink}
            href="https://github.com/KMihajlo/web-scraping-search-engine"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open GitHub repository"
          >
            <svg className="gh-btn__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                  fill="currentColor"
                  d="M12 0a12 12 0 00-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.84 2.8 1.31 3.48 1 .11-.77.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0012 0z"
              />
            </svg>
            GitHub Repo
          </a>
        </footer>
      </main>

      {showModalQuote && (
        <div className={styles.modalOverlay} onClick={() => setShowModalQuote(null)}>
          <div className={`${styles.modal} ${styles.quoteModal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setShowModalQuote(null)}>×</button>
            <div className={styles.modalQuoteText}>“{showModalQuote.text}”</div>
            <div className={styles.modalQuoteAuthor}>— {showModalQuote.author}</div>
            <div className={styles.modalTags}>
              {showModalQuote.tags.map(tag => (
                <button key={tag} className={`${styles.tag} ${styles.quoteTag}`} onClick={() => onTagClick(tag)}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
            <div className={styles.relatedHeader}>Related Quotes</div>
            <div className={styles.relatedGrid}>
              {quotes.filter(q => q !== showModalQuote && q.tags.some(t => showModalQuote.tags.includes(t))).slice(0, 6).map((qt, idx) => (
                <RelatedQuoteCard key={`${qt.text.slice(0,20)}-${idx}`} quote={qt} onClick={() => setShowModalQuote(qt)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showModalBook && (
        <div className={styles.modalOverlay} onClick={() => setShowModalBook(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setShowModalBook(null)}>×</button>
            <div className={styles.bookTopSection}>
              <img src={String(showModalBook.imageUrl)} alt={showModalBook.title} className={styles.bookTopImage} />
              <div className={styles.bookTopRight}>
                <div className={styles.bookTopTitle}>{showModalBook.title}</div>
                <div className={styles.bookTopPriceAvailability}>
                  <div className={styles.bookTopPrice}>
                    {showModalBook.priceInclTax ? `£${showModalBook.priceInclTax}` : (typeof showModalBook.price === 'number' ? `£${showModalBook.price}` : showModalBook.price)}
                  </div>
                  {showModalBook.availability && (
                    <div className={styles.bookTopAvailability}>{showModalBook.availability}</div>
                  )}
                </div>
                <div className={styles.bookTopRating}>{renderStars(showModalBook.rating, 'lg')}</div>
                {showModalBook.category && (
                  <button className={`${styles.tag} ${styles.bookTag}`} onClick={() => { setMode('books'); setQuery(showModalBook.category!); }}>
                    {showModalBook.category.charAt(0).toUpperCase() + showModalBook.category.slice(1)}
                  </button>
                )}
              </div>
            </div>

            {/* Description section */}
            {showModalBook.description && (
              <div className={styles.bookDescriptionSection}>
                <div className={styles.detailLabel}>Description</div>
                <div className={styles.detailValue}>{showModalBook.description}</div>
              </div>
            )}

            {/* Other details grid */}
            <div className={styles.bookDetailsGrid}>
              {showModalBook.upc && (
                <div>
                  <div className={styles.detailLabel}>UPC</div>
                  <div className={styles.detailValue}>{showModalBook.upc}</div>
                </div>
              )}
              {showModalBook.productType && (
                <div>
                  <div className={styles.detailLabel}>Product Type</div>
                  <div className={styles.detailValue}>{showModalBook.productType}</div>
                </div>
              )}
              {(showModalBook.priceExclTax || showModalBook.priceInclTax) && (
                <div>
                  <div className={styles.detailLabel}>Prices</div>
                  <div className={styles.detailValue}>
                    {showModalBook.priceExclTax ? `Excl. Tax: £${showModalBook.priceExclTax}` : ''}
                    {showModalBook.priceInclTax ? ` | Incl. Tax: £${showModalBook.priceInclTax}` : ''}
                  </div>
                </div>
              )}
              {showModalBook.tax && (
                <div>
                  <div className={styles.detailLabel}>Tax</div>
                  <div className={styles.detailValue}>£{showModalBook.tax}</div>
                </div>
              )}
              {typeof showModalBook.numberOfReviews === 'number' && (
                <div>
                  <div className={styles.detailLabel}>Reviews</div>
                  <div className={styles.detailValue}>{showModalBook.numberOfReviews}</div>
                </div>
              )}
            </div>

            {/* Related books */}
            <div className={styles.relatedHeader}>Related Books</div>
            <div className={styles.relatedGrid}>
              {books.filter(b => b !== showModalBook && b.category && showModalBook.category && b.category === showModalBook.category).slice(0, 8).map((rb, idx) => (
                <div key={`${rb.title}-${idx}`} className={`${styles.relatedCard} ${styles.relatedBookCard}`} onClick={() => setShowModalBook(rb)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(rb.imageUrl)} alt={rb.title} className={styles.relatedBookImage} />
                  <div className={styles.relatedBookTitle}>{rb.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
