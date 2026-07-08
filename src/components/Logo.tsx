// A CSS approximation of the JIUnity mark (navy / green / gold / purple squares) +
// wordmark. Swap for the official logo asset when available.
export function Logo({
  size = "md",
  withWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
}) {
  const box =
    size === "lg" ? "h-4 w-4" : size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const gap = size === "lg" ? "gap-1" : "gap-0.5";
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`grid grid-cols-2 ${gap}`} aria-hidden>
        <span className={`${box} rounded-[2px] bg-navy-800`} />
        <span className={`${box} rounded-[2px] bg-brandgreen`} />
        <span className={`${box} rounded-[2px] bg-gold`} />
        <span className={`${box} rounded-[2px] bg-brandpurple`} />
      </span>
      {withWordmark && (
        <span className={`${text} font-bold tracking-tight text-navy-800`}>
          JIU<span className="font-semibold text-navy-500">nity</span>
        </span>
      )}
    </span>
  );
}
