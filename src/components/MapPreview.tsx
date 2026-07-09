// A small map picture with a pin at (lat, lng). Uses the OpenStreetMap embed, so it needs
// no API key and works anywhere. Safe in both server and client components — it is just an
// iframe to openstreetmap.org plus a link to open the full map.
export function MapPreview({
  lat,
  lng,
  height = 170,
  className = "",
}: {
  lat: number;
  lng: number;
  height?: number;
  className?: string;
}) {
  const d = 0.004; // a street-level window around the point
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const full = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  return (
    <div className={`overflow-hidden rounded-xl border border-navy-100 ${className}`}>
      <iframe
        title="Location map"
        src={src}
        loading="lazy"
        className="block w-full"
        style={{ height, border: 0 }}
      />
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
