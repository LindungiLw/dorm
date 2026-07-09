"use client";

import { useState } from "react";

// A small map picture with a pin at (lat, lng). Uses the OpenStreetMap embed, so it needs
// no API key. The map viewer + tiles load over the network, so we show an instant
// placeholder and fade the map in once it is ready (no blank white box while it loads).
export function MapPreview({
  lat,
  lng,
  height = 170,
  className = "",
  eager = false,
}: {
  lat: number;
  lng: number;
  height?: number;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const d = 0.004; // a street-level window around the point
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const full = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  return (
    <div className={`overflow-hidden rounded-xl border border-navy-100 ${className}`}>
      <div className="relative bg-navy-50" style={{ height }}>
        {!loaded && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-1 text-navy-300">
            <PinIcon />
            <span className="text-xs">Loading map…</span>
          </div>
        )}
        <iframe
          title="Location map"
          src={src}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ border: 0 }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 bg-navy-50 px-3 py-1.5">
        <span className="text-xs text-navy-500">
          📍 {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        <a
          href={full}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-medium text-navy-600 hover:underline"
        >
          Open larger map
        </a>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
