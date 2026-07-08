// Official JIUnity mark (public/icon_logo.png) + wordmark.
export function Logo({
  size = "md",
  withWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
}) {
  const mark = size === "lg" ? "h-9" : size === "sm" ? "h-5" : "h-7";
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon_logo.png"
        alt="JIUnity"
        className={`${mark} w-auto`}
        aria-hidden={withWordmark}
      />
      {withWordmark && (
        <span className={`${text} font-bold tracking-tight text-navy-800`}>
          JIU<span className="font-semibold text-navy-500">nity</span>
        </span>
      )}
    </span>
  );
}
