import React, { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Button from "../common/Button";
import { formatPrice } from "../../utils/price";

const EMPTY_ROOM = {
  name: "",
  description: "",
  price: "",
  totalRooms: 1,
  images: [],
  amenitiesText: "",
};

function roomToForm(room) {
  return {
    name: room?.name || "",
    description: room?.description || "",
    price: room?.price ?? "",
    totalRooms: room?.totalRooms ?? 1,
    images: room?.images || [],
    amenitiesText: (room?.amenities || []).join(", "),
  };
}

function roomToPayload(room) {
  return {
    name: String(room.name || "").trim(),
    description: String(room.description || "").trim(),
    price: Number(room.price),
    totalRooms: Number(room.totalRooms),
    images: Array.isArray(room.images) ? room.images : [],
    amenities: String(room.amenitiesText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export default function ListingRoomsPanel({ listing, onSave }) {
  const [rooms, setRooms] = useState(listing.rooms || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(EMPTY_ROOM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRooms(listing.rooms || []);
    setEditingIndex(null);
    setDraft(EMPTY_ROOM);
    setError("");
  }, [listing]);

  function startAdd() {
    setError("");
    setEditingIndex(-1);
    setDraft({ ...EMPTY_ROOM });
  }

  function startEdit(index) {
    setError("");
    setEditingIndex(index);
    setDraft(roomToForm(rooms[index]));
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraft(EMPTY_ROOM);
    setError("");
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveDraft(event) {
    event.preventDefault();
    const nextRoom = roomToPayload(draft);
    if (!nextRoom.name) {
      setError("Room name is required.");
      return;
    }
    if (!Number.isFinite(nextRoom.price) || nextRoom.price < 0) {
      setError("Enter a valid room price.");
      return;
    }
    if (!Number.isInteger(nextRoom.totalRooms) || nextRoom.totalRooms < 1) {
      setError("Units available must be a whole number greater than zero.");
      return;
    }
    if (rooms.some((room, index) => index !== editingIndex && room.name.trim().toLowerCase() === nextRoom.name.toLowerCase())) {
      setError("Room names must be unique within a listing.");
      return;
    }

    setRooms((current) => {
      if (editingIndex === -1) return [...current, nextRoom];
      return current.map((room, index) => (index === editingIndex ? { ...room, ...nextRoom } : room));
    });
    cancelEdit();
  }

  function removeRoom(index) {
    if (rooms.length === 1) {
      setError("A listing must have at least one room category.");
      return;
    }
    setRooms((current) => current.filter((_, roomIndex) => roomIndex !== index));
    setError("");
  }

  async function saveRooms() {
    if (!rooms.length) {
      setError("Add at least one room category before saving.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(rooms.map((room) => roomToPayload(room)));
    } catch (saveError) {
      setError(saveError?.message || "Could not save room categories.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Room inventory</p>
          <h2 className="mt-1 text-lg font-bold text-ink-900">{listing.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={startAdd} disabled={editingIndex !== null}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add room
          </Button>
          <Button type="button" size="sm" onClick={saveRooms} disabled={isSaving || editingIndex !== null}>
            <Save className="h-4 w-4" aria-hidden="true" /> {isSaving ? "Saving..." : "Save rooms"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {rooms.map((room, index) => (
          <article key={room._id || `${room.name}-${index}`} className="rounded-xl border border-ink-300 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-ink-900">{room.name}</h3>
                <p className="mt-1 text-sm text-ink-600">{room.description || "No room description"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(index)} disabled={editingIndex !== null} className="text-brand hover:text-brand-hover" aria-label={`Edit ${room.name}`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => removeRoom(index)} disabled={editingIndex !== null} className="text-danger hover:opacity-80" aria-label={`Remove ${room.name}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span><strong>{formatPrice(Number(room.price))}</strong> / night</span>
              <span className="text-ink-500">{room.totalRooms} unit{room.totalRooms !== 1 ? "s" : ""}</span>
            </div>
            {room.amenities?.length > 0 && <p className="mt-3 text-xs text-ink-500">{room.amenities.join(", ")}</p>}
          </article>
        ))}
      </div>

      {!rooms.length && <p className="mt-4 text-sm text-danger">This listing needs at least one room category.</p>}

      {editingIndex !== null && (
        <form onSubmit={saveDraft} className="mt-5 rounded-xl border border-brand bg-brand-light/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-ink-900">{editingIndex === -1 ? "Add room category" : "Edit room category"}</h3>
            <button type="button" onClick={cancelEdit} aria-label="Cancel room edit" className="text-ink-500 hover:text-ink-900">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Room name</span>
              <input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Classic, Deluxe, Suite" className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Price per night</span>
              <input required type="number" min="0" value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Units available</span>
              <input required type="number" min="1" step="1" value={draft.totalRooms} onChange={(event) => updateDraft("totalRooms", event.target.value)} className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Description</span>
              <textarea rows={2} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Amenities</span>
              <input value={draft.amenitiesText} onChange={(event) => updateDraft("amenitiesText", event.target.value)} placeholder="King bed, balcony, breakfast" className="w-full rounded-sm border border-ink-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
            <Button type="submit" size="sm"><Save className="h-4 w-4" aria-hidden="true" /> Apply room changes</Button>
          </div>
        </form>
      )}
    </section>
  );
}
