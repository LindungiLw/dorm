"use client";

import { useState } from "react";
import { MapPreview } from "@/components/MapPreview";

export type Coords = { lat: number; lng: number };

// Captures a location point via the browser Geolocation API. Controlled: the captured
// point is carried in the parent via `onChange`, and mirrored into hidden `lat`/`lng`
// fields for the server action. When `required`, the parent gates submit until it is set.
export function LocationField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: Coords | null;
  onChange: (c: Coords | null) => void;
  required?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function capture() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("idle");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name="lat" value={value?.lat ?? ""} readOnly />
      <input type="hidden" name="lng" value={value?.lng ?? ""} readOnly />
      <button
        type="button"
        onClick={capture}
        disabled={status === "loading"}
        className="btn-outline w-full justify-center text-sm sm:w-auto"
      >
        <PinIcon />
        {status === "loading"
          ? "Getting location…"
          : value
            ? "Update location"
            : "Current location"}
      </button>
      {value ? (
        <>
          <MapPreview lat={value.lat} lng={value.lng} className="mt-3" eager />
          <p className="mt-1.5 text-xs font-medium text-emerald-600">
            Location captured. Submit to save it.
          </p>
        </>
      ) : (
        required && (
          <p className="mt-1.5 text-xs text-navy-400">
            Required to submit your leave pass.
          </p>
        )
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-amber-600">
          Couldn&rsquo;t get your location. Please allow location access and try again.
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
