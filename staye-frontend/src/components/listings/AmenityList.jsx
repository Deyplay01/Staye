import React from "react";
import {
  Wifi,
  Snowflake,
  Tv,
  Refrigerator,
  Coffee,
  Waves,
  BedDouble,
  Bath,
  ConciergeBell,
  Sun,
  PenSquare,
  Check,
} from "lucide-react";

const ICON_MAP = {
  "Free WiFi": Wifi,
  "Air conditioning": Snowflake,
  "Flat-screen TV": Tv,
  "Mini fridge": Refrigerator,
  "Breakfast included": Coffee,
  "Sea view": Waves,
  "King-size bed": BedDouble,
  "En-suite bathroom": Bath,
  "Room service": ConciergeBell,
  Balcony: Sun,
  "Work desk": PenSquare,
  Bathtub: Bath,
};

export default function AmenityList({ amenities = [] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {amenities.map((amenity) => {
        const Icon = ICON_MAP[amenity] || Check;
        return (
          <li key={amenity} className="flex items-center gap-2 text-sm text-ink-700">
            <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            {amenity}
          </li>
        );
      })}
    </ul>
  );
}
