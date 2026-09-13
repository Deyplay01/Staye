import React, { useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import Button from "../common/Button";
import { uploadImages } from "../../api";
import { useAuth } from "../../context/AuthContext";

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  totalRooms: 1,
  location: "",
  images: [],
  amenitiesText: "",
};

// The real backend stores images/amenities as string arrays. To keep the
// form dead simple, we edit them as plain text (one image URL per line,
// amenities comma-separated) and split into arrays on submit.
function listingToForm(listing) {
  if (!listing) return EMPTY_FORM;
  return {
    title: listing.title || "",
    description: listing.description || "",
    price: listing.price ?? "",
    totalRooms: listing.totalRooms ?? 1,
    location: listing.location || "",
    images: listing.images || [],
    amenitiesText: (listing.amenities || []).join(", "),
  };
}

export default function ListingFormModal({ initialListing, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(listingToForm(initialListing));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isEditing = Boolean(initialListing);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      totalRooms: Number(form.totalRooms),
      location: form.location,
      images: form.images,
      amenities: form.amenitiesText.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      setUploadError("Only image files can be uploaded.");
    }
    if (!imageFiles.length) {
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    if (imageFiles.length === files.length) setUploadError("");
    try {
      const result = await uploadImages(imageFiles, localStorage.getItem("staye_token"));
      const uploadedUrls = (result.images || []).map((image) => image.url);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      setUploadError(error.message || "Image upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-sm bg-white p-6 shadow-popover">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">{isEditing ? "Edit listing" : "Add a new listing"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-ink-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Description</span>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Price per night (NGN)</span>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Location</span>
              <input
                required
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Available rooms</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.totalRooms}
                onChange={(e) => update("totalRooms", e.target.value)}
                className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">
              Listing images <span className="font-normal text-ink-500">(images only, up to 10)</span>
            </span>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#96BE8C] bg-[#C9F2C7]/40 px-4 py-4 text-sm font-semibold text-[#243119] hover:bg-[#C9F2C7]">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              {isUploading ? "Uploading images..." : "Choose image files"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                disabled={isUploading || !user}
                className="sr-only"
              />
            </label>
            {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}
            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.images.map((imageUrl) => (
                  <div key={imageUrl} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-300 bg-[#C9F2C7]">
                    <img src={imageUrl} alt="Listing preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((image) => image !== imageUrl) }))}
                      className="absolute right-1 top-1 rounded-full bg-[#243119]/85 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">
              Amenities <span className="font-normal text-ink-500">(comma-separated)</span>
            </span>
            <input
              value={form.amenitiesText}
              onChange={(e) => update("amenitiesText", e.target.value)}
              placeholder="Free WiFi, Breakfast included, Sea view"
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-ink-300 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save changes" : "Add listing"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
