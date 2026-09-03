import { useState } from "react";
import "./App.css";

const propertyTypes = ["Hotels", "Apartments", "Villas", "Resorts", "B&Bs"];

const filters = [
  "Free cancellation",
  "Breakfast included",
  "Pool",
  "Pet-friendly",
  "Spa",
  "Airport transfer",
];

const properties = [
  {
    id: 1,
    name: "Amber Palace Hotel",
    location: "Florence City Centre - 0.4 km from Duomo",
    stars: 5,
    rating: 9.4,
    ratingLabel: "Exceptional",
    reviews: 2341,
    price: 349,
    originalPrice: 480,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop&auto=format",
    badge: "Genius Deal",
    tags: ["Free cancellation", "Breakfast included"],
    beds: "1 king bed",
    type: "Deluxe Suite",
  },
  {
    id: 2,
    name: "Villa Caramel",
    location: "Fiesole Hills - 3.2 km from centre",
    stars: 4,
    rating: 8.8,
    ratingLabel: "Fabulous",
    reviews: 1087,
    price: 218,
    originalPrice: null,
    img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=280&fit=crop&auto=format",
    badge: null,
    tags: ["Free cancellation", "Pool"],
    beds: "1 queen bed",
    type: "Superior Room",
  },
  {
    id: 3,
    name: "Grand Mocha Residences",
    location: "Oltrarno - 1.1 km from Ponte Vecchio",
    stars: 4,
    rating: 9.1,
    ratingLabel: "Wonderful",
    reviews: 876,
    price: 175,
    originalPrice: 210,
    img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=280&fit=crop&auto=format",
    badge: "Limited offer",
    tags: ["Breakfast included", "Spa"],
    beds: "2 single beds",
    type: "Classic Double",
  },
  {
    id: 4,
    name: "Vineyard Boutique Hotel",
    location: "Chianti, Tuscany - 18 km from Florence",
    stars: 5,
    rating: 9.6,
    ratingLabel: "Exceptional",
    reviews: 512,
    price: 495,
    originalPrice: 620,
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=280&fit=crop&auto=format",
    badge: "Genius Deal",
    tags: ["Free cancellation", "Breakfast included", "Pool"],
    beds: "1 king bed",
    type: "Vineyard Suite",
  },
  {
    id: 5,
    name: "Copper Lantern Inn",
    location: "Santa Croce - 0.8 km from centre",
    stars: 3,
    rating: 8.3,
    ratingLabel: "Very Good",
    reviews: 1934,
    price: 112,
    originalPrice: null,
    img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=280&fit=crop&auto=format",
    badge: null,
    tags: ["Pet-friendly", "Airport transfer"],
    beds: "1 double bed",
    type: "Standard Room",
  },
  {
    id: 6,
    name: "Burnt Sienna Suites",
    location: "Pitti Palace area - 0.6 km from centre",
    stars: 4,
    rating: 9.0,
    ratingLabel: "Wonderful",
    reviews: 743,
    price: 265,
    originalPrice: 310,
    img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=280&fit=crop&auto=format",
    badge: "Popular",
    tags: ["Breakfast included", "Free cancellation"],
    beds: "1 king bed",
    type: "Junior Suite",
  },
];

const popularDests = [
  {
    city: "Rome",
    props: 4820,
    img: "https://images.unsplash.com/photo-1549516192-1232e46d3cd1?w=300&h=200&fit=crop&auto=format",
  },
  {
    city: "Venice",
    props: 2310,
    img: "https://images.unsplash.com/photo-1605140801067-6b8dc8aa6671?w=300&h=200&fit=crop&auto=format",
  },
  {
    city: "Milan",
    props: 3680,
    img: "https://images.unsplash.com/photo-1554610758-4dc60c19ccd3?w=300&h=200&fit=crop&auto=format",
  },
  {
    city: "Amalfi",
    props: 890,
    img: "https://images.unsplash.com/photo-1571930884060-d8f6b9cb05f2?w=300&h=200&fit=crop&auto=format",
  },
];

function StarRating({ count }) {
  return (
    <span className="star-rating">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < count ? "star star-active" : "star"}
          aria-hidden="true"
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

function RatingBadge({ score, label }) {
  return (
    <div className="rating-badge">
      <span className="rating-score">{score}</span>
      <div>
        <p className="rating-label">{label}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [destination, setDestination] = useState("Florence, Italy");
  const [checkIn, setCheckIn] = useState("2026-09-15");
  const [checkOut, setCheckOut] = useState("2026-09-18");
  const [rooms, setRooms] = useState("1 room - 2 adults");
  const [activeType, setActiveType] = useState("Hotels");
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState("Our top picks");
  const [savedIds, setSavedIds] = useState([]);

  function toggleFilter(filter) {
    setActiveFilters((previousFilters) =>
      previousFilters.includes(filter)
        ? previousFilters.filter((item) => item !== filter)
        : [...previousFilters, filter]
    );
  }

  function toggleSave(id) {
    setSavedIds((previousIds) =>
      previousIds.includes(id)
        ? previousIds.filter((item) => item !== id)
        : [...previousIds, id]
    );
  }

  const filtered = properties.filter((property) => {
    return (
      activeFilters.length === 0 ||
      activeFilters.every((filter) => property.tags.includes(filter))
    );
  });

  return (
    <div className="app">
      <header className="site-header">
        <div className="container nav-row">
          <div className="logo">Staye</div>

          <div className="nav-actions">
            <button>List your property</button>
            <button>Help</button>
            <button className="outline-button">Sign in</button>
            <button className="light-button">Register</button>
          </div>
        </div>

        <div className="container property-tabs">
          {propertyTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={activeType === type ? "active-tab" : ""}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <section className="hero">
        <div className="container hero-content">
          <h1>Find your next stay</h1>
          <p>Search low prices on hotels, homes and much more...</p>

          <div className="search-box">
            <div className="search-field">
              <span className="search-icon" aria-hidden="true">
                &#128269;
              </span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Where are you going?"
              />
            </div>

            <div className="date-group">
              <label className="date-field">
                <span>Check-in</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </label>

              <label className="date-field">
                <span>Check-out</span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </label>
            </div>

            <div className="search-field rooms-field">
              <span className="search-icon" aria-hidden="true">
                &#128719;
              </span>
              <input
                value={rooms}
                onChange={(event) => setRooms(event.target.value)}
              />
            </div>

            <button className="search-button">Search</button>
          </div>
        </div>
      </section>

      <section className="genius-banner">
        <div className="container genius-content">
          <span>Genius</span>
          <p>
            You're eligible for <strong>Genius discounts</strong> on select
            properties. <a href="#">Sign in</a> to save up to 15%.
          </p>
        </div>
      </section>

      <main className="container main-content">
        <section className="destinations">
          <h2>Popular in Italy</h2>
          <p>These destinations are trending among travellers like you</p>

          <div className="destination-grid">
            {popularDests.map(({ city, props, img }) => (
              <button key={city} className="destination-card">
                <img src={img} alt={city} />
                <span className="image-overlay"></span>
                <span className="destination-text">
                  <strong>{city}</strong>
                  <small>{props.toLocaleString()} properties</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="results-layout">
          <aside className="filters-panel">
            <h3>Filter by</h3>

            <div className="filter-section">
              <h4>Your budget (per night)</h4>
              <div className="budget-buttons">
                {["< EUR100", "EUR100-EUR200", "EUR200-EUR400", "EUR400+"].map(
                  (budget) => (
                    <button key={budget}>{budget}</button>
                  )
                )}
              </div>
            </div>

            <div className="filter-section">
              <h4>Popular filters</h4>
              <div className="checkbox-list">
                {filters.map((filter) => (
                  <label key={filter}>
                    <input
                      type="checkbox"
                      checked={activeFilters.includes(filter)}
                      onChange={() => toggleFilter(filter)}
                    />
                    <span>{filter}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Star rating</h4>
              <div className="star-buttons">
                {[3, 4, 5].map((number) => (
                  <button key={number}>
                    {Array.from({ length: number }).map((_, index) => (
                      <span key={index}>&#9733;</span>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="property-results">
            <div className="sort-row">
              <p>
                <strong>{filtered.length} properties</strong> found in Florence
              </p>

              <label>
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {[
                    "Our top picks",
                    "Price (low to high)",
                    "Price (high to low)",
                    "Best rating",
                  ].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="property-list">
              {filtered.map((property) => (
                <article key={property.id} className="property-card">
                  <div className="property-image">
                    <img src={property.img} alt={property.name} />

                    <button
                      onClick={() => toggleSave(property.id)}
                      className="save-button"
                      aria-label="Save property"
                    >
                      {savedIds.includes(property.id) ? "\u2665" : "\u2661"}
                    </button>

                    {property.badge && (
                      <span className="property-badge">{property.badge}</span>
                    )}
                  </div>

                  <div className="property-info">
                    <div className="property-details">
                      <a href="#" className="property-name">
                        {property.name}
                      </a>

                      <StarRating count={property.stars} />

                      <p className="property-location">{property.location}</p>

                      <span className="room-chip">
                        {property.type} - {property.beds}
                      </span>

                      <div className="tag-list">
                        {property.tags.map((tag) => (
                          <span key={tag}>
                            <span aria-hidden="true">&#10003;</span> {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="property-booking">
                      <RatingBadge
                        score={property.rating}
                        label={property.ratingLabel}
                      />

                      <p className="reviews">
                        {property.reviews.toLocaleString()} reviews
                      </p>

                      <div className="price-area">
                        {property.originalPrice && (
                          <p className="old-price">EUR{property.originalPrice}</p>
                        )}
                        <p className="new-price">EUR{property.price}</p>
                        <p className="price-note">per night</p>
                        <p className="price-note">Includes taxes & fees</p>
                        <button>See availability</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="empty-state">
                  <p className="empty-title">No properties match your filters</p>
                  <p>Try removing some filters to see more results</p>
                  <button onClick={() => setActiveFilters([])}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          {[
            {
              heading: "Support",
              links: [
                "Help Centre",
                "Cancellation options",
                "Safety resource centre",
                "Report a concern",
              ],
            },
            {
              heading: "Discover",
              links: [
                "Genius loyalty programme",
                "Seasonal deals",
                "Travel articles",
                "Travel communities",
              ],
            },
            {
              heading: "Terms & Settings",
              links: [
                "Privacy & Cookies",
                "Terms & Conditions",
                "Dispute resolution",
                "Modern Slavery Statement",
              ],
            },
            {
              heading: "Partners",
              links: [
                "Partner Help",
                "List your property",
                "Become an affiliate",
                "Work with us",
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4>{heading}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="container footer-bottom">
          <div className="footer-logo">Staye</div>
          <p>2026 Staye. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
