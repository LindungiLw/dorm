"use client";

import { useState } from "react";
import { MapPreview } from "@/components/MapPreview";

// Captures a location point via the browser Geolocation API and carries it in hidden
// `lat`/`lng` fields. Optional — the form still submits if the user declines.
export function LocationField({ label }: { label: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function capture() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("idle");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name="lat" value={coords?.lat ?? ""} readOnly />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} readOnly />
      <button
        type="button"
        onClick={capture}
        disabled={status === "loading"}
        className="btn-outline w-full justify-center text-sm sm:w-auto"
      >
        <PinIcon />
        {status === "loading"
          ? "Getting location…"
          : coords
            ? "Update Location"
            : "Current Location"}
      </button>
      {coords && (
        <>
          <MapPreview lat={coords.lat} lng={coords.lng} className="mt-3" eager />
          <p className="mt-1.5 text-xs font-medium text-emerald-600">
            Location captured. Submit to save it.
          </p>
        </>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-amber-600">
          Couldn&rsquo;t get your location. You can still submit without it.
        </p>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
