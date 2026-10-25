const express = require("express");
const mongoose = require("mongoose");
const Listing = require("../models/Listings");

const router = express.Router();

function getFrontendOrigin() {
    const frontendUrl = process.env.FRONTEND_URL?.split(",")[0].trim();
    if (!frontendUrl) {
        throw new Error("FRONTEND_URL must be configured to serve SEO pages.");
    }
    return new URL(frontendUrl).origin;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);
}

function escapeJsonForHtml(value) {
    return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => ({
        "<": "\\u003c",
        ">": "\\u003e",
        "&": "\\u0026",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
    })[character]);
}

function getImageUrl(image, frontendOrigin, backendOrigin) {
    if (!image) return undefined;
    try {
        const baseUrl = image.startsWith("/uploads/") ? backendOrigin : frontendOrigin;
        const url = new URL(image, baseUrl);
        return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
    } catch {
        return undefined;
    }
}

function getDescription(listing) {
    const description = String(listing.description || "").replace(/\s+/g, " ").trim();
    return description.length > 153 ? `${description.slice(0, 150)}…` : description;
}

function renderListingPage(listing, frontendOrigin, backendOrigin) {
    const canonicalUrl = `${frontendOrigin}/listings/${listing._id}`;
    const title = `${listing.title} in ${listing.location} | Staye`;
    const description = getDescription(listing)
        || `View ${listing.title} in ${listing.location}, compare room options, and plan your trip with Staye.`;
    const image = (listing.images || [])
        .map((url) => getImageUrl(url, frontendOrigin, backendOrigin))
        .find(Boolean);
    const schema = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        name: listing.title,
        description,
        url: canonicalUrl,
        address: {
            "@type": "PostalAddress",
            addressLocality: listing.location,
        },
    };
    if (image) schema.image = image;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Staye">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}
    <script type="application/ld+json">${escapeJsonForHtml(schema)}</script>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(listing.title)}</h1>
      <p>${escapeHtml(listing.location)}</p>
      <p>${escapeHtml(description)}</p>
      <a href="${escapeHtml(canonicalUrl)}">View this stay on Staye</a>
    </main>
  </body>
</html>`;
}

function renderListingDirectoryPage(listings, frontendOrigin, backendOrigin) {
    const canonicalUrl = `${frontendOrigin}/listings`;
    const title = "Explore places to stay | Staye";
    const description = "Browse available places to stay, compare room options, and find the right fit for your next trip with Staye.";
    const image = listings
        .flatMap((listing) => listing.images || [])
        .map((url) => getImageUrl(url, frontendOrigin, backendOrigin))
        .find(Boolean);
    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        url: canonicalUrl,
        itemListElement: listings.map((listing, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: listing.title,
            url: `${frontendOrigin}/listings/${listing._id}`,
        })),
    };
    const listingLinks = listings.map((listing) => `
      <li>
        <article>
          <h2><a href="${escapeHtml(`${frontendOrigin}/listings/${listing._id}`)}">${escapeHtml(listing.title)}</a></h2>
          <p>${escapeHtml(listing.location)}</p>
          <p>${escapeHtml(getDescription(listing))}</p>
        </article>
      </li>`).join("");

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Staye">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}
    <script type="application/ld+json">${escapeJsonForHtml(schema)}</script>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <ul>${listingLinks}
      </ul>
    </main>
  </body>
</html>`;
}

router.get("/listings", async (req, res) => {
    try {
        const frontendOrigin = getFrontendOrigin();
        const backendOrigin = `${req.protocol}://${req.get("host")}`;
        const listings = await Listing.find({ status: "approved" })
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" })
            .select("_id title description location images")
            .sort({ updatedAt: -1 })
            .limit(24);
        const publicListings = listings.filter((listing) => listing.hostId);

        return res
            .type("html")
            .set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400")
            .send(renderListingDirectoryPage(publicListings, frontendOrigin, backendOrigin));
    } catch (error) {
        console.error("Error generating listings SEO page:", error.message);
        return res.status(500).type("text/plain").send("Could not load listings.");
    }
});

router.get("/sitemap.xml", async (_req, res) => {
    try {
        const frontendOrigin = getFrontendOrigin();
        const listings = await Listing.find({ status: "approved" })
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" })
            .select("_id updatedAt")
            .sort({ updatedAt: -1 });
        const publicListings = listings.filter((listing) => listing.hostId);
        const urls = [
            { loc: `${frontendOrigin}/`, lastmod: new Date().toISOString() },
            { loc: `${frontendOrigin}/listings`, lastmod: new Date().toISOString() },
            ...publicListings.map((listing) => ({
                loc: `${frontendOrigin}/listings/${listing._id}`,
                lastmod: listing.updatedAt?.toISOString(),
            })),
        ];
        const entries = urls.map(({ loc, lastmod }) => `
  <url>
    <loc>${escapeHtml(loc)}</loc>${lastmod ? `
    <lastmod>${escapeHtml(lastmod)}</lastmod>` : ""}
  </url>`).join("");

        res
            .type("application/xml")
            .set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400")
            .send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`);
    } catch (error) {
        console.error("Error generating sitemap:", error.message);
        res.status(500).type("text/plain").send("Could not generate sitemap.");
    }
});

router.get("/listings/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).type("text/plain").send("Listing not found.");
    }

    try {
        const frontendOrigin = getFrontendOrigin();
        const backendOrigin = `${req.protocol}://${req.get("host")}`;
        const listing = await Listing.findOne({ _id: req.params.id, status: "approved" })
            .populate({ path: "hostId", match: { status: { $ne: "blocked" } }, select: "_id" })
            .select("title description location images");
        if (!listing || !listing.hostId) {
            return res.status(404).type("text/plain").send("Listing not found.");
        }

        return res
            .type("html")
            .set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400")
            .send(renderListingPage(listing, frontendOrigin, backendOrigin));
    } catch (error) {
        console.error("Error generating listing SEO page:", error.message);
        return res.status(500).type("text/plain").send("Could not load listing.");
    }
});

module.exports = router;
