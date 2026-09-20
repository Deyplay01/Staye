import apiClient from "./client";

export async function fetchListings(params = {}) {
  const { data } = await apiClient.get("/listings", { params });
  return data; // { listings, page, limit }
}

export async function fetchPopularLocations() {
  const { data } = await apiClient.get("/listings/popular-locations");
  return data.locations || [];
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
