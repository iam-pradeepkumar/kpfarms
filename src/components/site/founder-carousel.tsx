import { useEffect, useRef, useState } from "react";

export type FounderCarouselProps = {
  photos: { url: string; caption?: string; zoom?: number; focus?: string }[];
  initials: string;
  altBase: string;
  className?: string;
};

/**
 * Auto-playing carousel of founder / family photos.
 * - Tap the photo to advance to the next slide.
 * - Press-and-hold pauses auto-play; release resumes.
 * - No visible nav buttons (they were covering faces).
 */
export function FounderCarousel({
  photos,
  initials,
  altBase,
  className = "",
}: FounderCarouselProps) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = photos.length;
  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), 4000);
    return () => clearInterval(t);
  }, [count, paused]);

  if (count === 0) {
    return (
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-kp-green/20 via-kp-gold/20 to-kp-red/20 shadow-md ring-4 ring-white ${className}`}
      >
        <div className="flex size-full items-center justify-center">
          <span className="font-display text-6xl font-extrabold text-kp-green">{initials}</span>
        </div>
      </div>
    );
  }

  const next = () => setI((n) => (n + 1) % count);

  const startHold = () => {
    heldRef.current = false;
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      setPaused(true);
    }, 180);
  };
  const endHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (heldRef.current) {
      setPaused(false);
    } else if (count > 1) {
      next();
    }
    heldRef.current = false;
  };
  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (heldRef.current) setPaused(false);
    heldRef.current = false;
  };

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md ring-4 ring-white ${className}`}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      role={count > 1 ? "button" : undefined}
      aria-label={count > 1 ? "Tap to change photo, hold to pause" : undefined}
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out select-none"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {photos.map((p, idx) => (
          <div key={idx} className="relative h-full w-full shrink-0 overflow-hidden">
            <img
              src={p.url}
              alt={`${altBase} (${idx + 1}/${count})`}
              className="size-full object-cover pointer-events-none"
              style={{
                transform: p.zoom && p.zoom !== 1 ? `scale(${p.zoom})` : undefined,
                transformOrigin: "center",
                objectPosition: p.focus ?? "center",
              }}
              draggable={false}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {photos.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-6 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
