import React, { useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import Button from "../common/Button";
import { uploadImages } from "../../api";
import { useAuth } from "../../context/AuthContext";

const EMPTY_ROOM = {
  name: "",
  description: "",
  price: "",
  totalRooms: 1,
  images: [],
  amenitiesText: "",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  location: "",
  images: [],
  amenitiesText: "",
  rooms: [EMPTY_ROOM],
};

function formatRoomPayload(room) {
  return {
    name: String(room.name || "").trim(),
    description: String(room.description || "").trim(),
    price: Number(room.price),
    totalRooms: Number(room.totalRooms || 1),
    images: Array.isArray(room.images) ? room.images : [],
    amenities: String(room.amenitiesText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function listingToForm(listing) {
  if (!listing) return EMPTY_FORM;
  const rooms = Array.isArray(listing.rooms) && listing.rooms.length
    ? listing.rooms.map((room) => ({
        name: room.name || "",
        description: room.description || "",
        price: room.price ?? "",
        totalRooms: room.totalRooms ?? 1,
        images: room.images || [],
        amenitiesText: (room.amenities || []).join(", "),
      }))
    : [EMPTY_ROOM];

  return {
    title: listing.title || "",
    description: listing.description || "",
    location: listing.location || "",
    images: listing.images || [],
    amenitiesText: (listing.amenities || []).join(", "),
    rooms,
  };
}

export default function ListingFormModal({ initialListing, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(listingToForm(initialListing));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isEditing = Boolean(initialListing);

  function updateListingField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateRoomField(roomIndex, field, value) {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => (index === roomIndex ? { ...room, [field]: value } : room)),
    }));
  }

  function addRoom() {
    setForm((prev) => ({ ...prev, rooms: [...prev.rooms, { ...EMPTY_ROOM }] }));
  }

  function removeRoom(index) {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.length > 1 ? prev.rooms.filter((_, roomIndex) => roomIndex !== index) : [EMPTY_ROOM],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const rooms = form.rooms.map(formatRoomPayload);
    onSave({
      title: form.title,
      description: form.description,
      location: form.location,
      images: form.images,
      amenities: form.amenitiesText.split(",").map((s) => s.trim()).filter(Boolean),
      rooms,
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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm bg-white p-6 shadow-popover">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">{isEditing ? "Edit listing" : "Add a new listing"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-ink-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => updateListingField("title", e.target.value)}
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Description</span>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => updateListingField("description", e.target.value)}
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Location</span>
            <input
              required
              value={form.location}
              onChange={(e) => updateListingField("location", e.target.value)}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

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
              onChange={(e) => updateListingField("amenitiesText", e.target.value)}
              placeholder="Free WiFi, Breakfast included, Sea view"
              className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-900">Room categories</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add room
              </Button>
            </div>

            {form.rooms.map((room, index) => (
              <div key={`${room.name || "new-room"}-${index}`} className="rounded-xl border border-ink-300 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-ink-900">Room {index + 1}</p>
                  {form.rooms.length > 1 && (
                    <button type="button" onClick={() => removeRoom(index)} className="text-xs font-semibold text-danger hover:underline">
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-ink-700">Room name</span>
                    <input
                      required
                      value={room.name}
                      onChange={(e) => updateRoomField(index, "name", e.target.value)}
                      placeholder="Classic, Deluxe, Suite"
                      className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-700">Price per night</span>
                    <input
                      required
                      type="number"
                      min="0"
                      value={room.price}
                      onChange={(e) => updateRoomField(index, "price", e.target.value)}
                      className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-700">Units available</span>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={room.totalRooms}
                      onChange={(e) => updateRoomField(index, "totalRooms", e.target.value)}
                      className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-ink-700">Room description</span>
                    <textarea
                      rows={2}
                      value={room.description}
                      onChange={(e) => updateRoomField(index, "description", e.target.value)}
                      className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-ink-700">Amenities (comma-separated)</span>
                    <input
                      value={room.amenitiesText}
                      onChange={(e) => updateRoomField(index, "amenitiesText", e.target.value)}
                      placeholder="King bed, breakfast, balcony"
                      className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-ink-300 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEditing ? "Save changes" : "Add listing"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
