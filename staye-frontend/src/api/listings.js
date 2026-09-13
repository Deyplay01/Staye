import apiClient from "./client";

/**
 * Matches routes/listings.js exactly.
 *   GET    /listings              query: page, limit, location, priceMin, priceMax, amenities
 *                                 -> { listings, page, limit }
 *   GET    /listings/my-listings  (admin only) -> { listings }
 *   GET    /listings/:id          -> raw listing object (NOT wrapped)
 *   POST   /listings              (admin only) body: { title, description, price, location, images, amenities }
 *                                 -> { message, listing }
 *   PUT    /listings/:id          (admin only) same body shape -> { message, listing }
 *   DELETE /listings/:id          (admin only) -> { message }
 *
 * Listing fields, straight from models/Listings.js:
 *   title, description, price, location, images[], amenities[], hostId, createdAt, updatedAt
 *   (no capacity, beds, room type, rating, or availability flag — none of that exists)
 */

export async function fetchListings(params = {}) {
  const { data } = await apiClient.get("/listings", { params });
  return data; // { listings, page, limit }
}

export async function fetchMyListings(params = {}) {
  const { data } = await apiClient.get("/listings/my-listings", { params });
  return data.listings;
}

export async function fetchListingById(id) {
  const { data } = await apiClient.get(`/listings/${id}`);
  return data; // raw listing
}

export async function createListing(payload) {
  const { data } = await apiClient.post("/listings", payload);
  return data.listing;
}

export async function updateListing(id, payload) {
  const { data } = await apiClient.put(`/listings/${id}`, payload);
  return data.listing;
}

export async function deleteListing(id) {
  const { data } = await apiClient.delete(`/listings/${id}`);
  return data;
}
