export function Chick({
  className = "",
  delay = 0,
  size = 40,
}: {
  className?: string;
  delay?: number;
  size?: number;
}) {
  return (
    <div
      className={`animate-chick-hop ${className}`}
      style={{ animationDelay: `${delay}s`, width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <ellipse cx="32" cy="40" rx="20" ry="18" fill="#F5C518" />
        <circle cx="32" cy="22" r="14" fill="#F5C518" />
        <ellipse className="animate-wing" cx="22" cy="42" rx="8" ry="10" fill="#E9B613" />
        <circle cx="37" cy="20" r="2.2" fill="#1a1a1a" />
        <circle cx="37.8" cy="19.4" r="0.7" fill="#fff" />
        <path className="animate-peck" d="M44 23 L52 25 L44 27 Z" fill="#F97316" />
        <path
          d="M26 56 L26 60 M23 60 L29 60"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M38 56 L38 60 M35 60 L41 60"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M30 8 Q32 4 34 8"
          stroke="#E9B613"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="mx-auto -mt-1 h-1.5 rounded-full bg-black/15 blur-[3px]"
        style={{ width: size * 0.5 }}
      />
    </div>
  );
}

export function Hen({
  className = "",
  size = 72,
  delay = 0,
}: {
  className?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size, animationDelay: `${delay}s` }}
      aria-hidden
    >
      <svg viewBox="0 0 96 72" width={size} height={size * 0.75}>
        {/* body */}
        <ellipse
          cx="52"
          cy="46"
          rx="28"
          ry="20"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1.2"
        />
        {/* tail */}
        <path
          d="M78 40 Q92 24 88 52 Q80 48 76 50 Z"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1.2"
        />
        {/* wing */}
        <path className="animate-wing" d="M46 40 Q56 30 66 42 Q56 52 46 48 Z" fill="#e2e8f0" />
        {/* head */}
        <circle cx="28" cy="30" r="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
        {/* comb */}
        <path d="M22 20 Q24 14 26 20 Q28 14 30 20 Q32 14 34 20 Z" fill="#dc2626" />
        {/* wattle */}
        <path d="M22 34 Q19 39 24 40 Z" fill="#dc2626" />
        {/* beak */}
        <path d="M16 30 L22 28 L22 32 Z" fill="#f59e0b" />
        {/* eye */}
        <circle cx="26" cy="28" r="1.6" fill="#111" />
        {/* legs */}
        <path
          d="M42 64 L42 70 M39 70 L45 70"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M58 64 L58 70 M55 70 L61 70"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function Feather({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 48"
      className={`animate-feather ${className}`}
      style={{ animationDelay: `${delay}s` }}
      width="18"
      height="36"
      aria-hidden
    >
      <path
        d="M12 2 C 4 12, 4 32, 12 46 C 20 32, 20 12, 12 2 Z"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="0.6"
        opacity="0.9"
      />
      <path d="M12 4 L12 44" stroke="#f59e0b" strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}

export function Egg({
  className = "",
  size = 28,
  delay = 0,
}: {
  className?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <svg
      viewBox="0 0 40 52"
      width={size}
      height={size * 1.3}
      className={`animate-egg-wobble ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <ellipse cx="20" cy="30" rx="16" ry="20" fill="#fff8ec" stroke="#f3d9a4" strokeWidth="1.2" />
      <ellipse cx="14" cy="20" rx="4" ry="6" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

export function Seed({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      className={`animate-seed-fall ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <ellipse cx="6" cy="6" rx="3" ry="5" fill="#f59e0b" />
    </svg>
  );
}

export function Sun({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="72"
      height="72"
      className={`animate-sun-rays ${className}`}
      aria-hidden
    >
      <circle cx="32" cy="32" r="12" fill="#fde68a" />
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <path d="M32 6 L32 14" />
        <path d="M32 50 L32 58" />
        <path d="M6 32 L14 32" />
        <path d="M50 32 L58 32" />
        <path d="M13 13 L19 19" />
        <path d="M45 45 L51 51" />
        <path d="M51 13 L45 19" />
        <path d="M19 45 L13 51" />
      </g>
    </svg>
  );
}

export function Cloud({
  className = "",
  delay = 0,
  opacity = 0.7,
}: {
  className?: string;
  delay?: number;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 60"
      width="120"
      height="60"
      className={`animate-cloud-drift ${className}`}
      style={{ animationDelay: `${delay}s`, opacity }}
      aria-hidden
    >
      <ellipse cx="30" cy="40" rx="22" ry="16" fill="#ffffff" />
      <ellipse cx="60" cy="30" rx="28" ry="20" fill="#ffffff" />
      <ellipse cx="90" cy="40" rx="22" ry="16" fill="#ffffff" />
    </svg>
  );
}

export function Rooster({
  className = "",
  size = 80,
  delay = 0,
}: {
  className?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size, animationDelay: `${delay}s` }}
      aria-hidden
    >
      <svg viewBox="0 0 100 80" width={size} height={size * 0.8}>
        <path d="M78 42 Q98 18 92 56 Q86 48 78 52 Z" fill="#dc2626" />
        <path d="M80 44 Q96 26 90 54 Q84 50 80 52 Z" fill="#f59e0b" />
        <path d="M82 46 Q94 34 88 52 Z" fill="#16a34a" />
        <ellipse
          cx="52"
          cy="50"
          rx="26"
          ry="18"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
        <path className="animate-wing" d="M44 44 Q56 34 68 46 Q56 56 44 52 Z" fill="#cbd5e1" />
        <circle cx="26" cy="30" r="13" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
        <path d="M18 18 Q20 10 24 18 Q26 8 30 18 Q32 10 34 18 Z" fill="#dc2626" />
        <path d="M18 34 Q14 42 22 42 Z" fill="#dc2626" />
        <path d="M12 30 L20 27 L20 33 Z" fill="#f59e0b" />
        <circle cx="24" cy="28" r="1.8" fill="#111" />
        <path
          d="M44 68 L44 76 M40 76 L48 76"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M60 68 L60 76 M56 76 L64 76"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function Corn({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 40"
      width="20"
      height="34"
      className={`animate-seed-fall ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <ellipse cx="12" cy="22" rx="6" ry="14" fill="#fbbf24" />
      <g fill="#f59e0b">
        <circle cx="9" cy="14" r="1.2" />
        <circle cx="12" cy="12" r="1.2" />
        <circle cx="15" cy="14" r="1.2" />
        <circle cx="9" cy="20" r="1.2" />
        <circle cx="12" cy="18" r="1.2" />
        <circle cx="15" cy="20" r="1.2" />
        <circle cx="9" cy="26" r="1.2" />
        <circle cx="12" cy="24" r="1.2" />
        <circle cx="15" cy="26" r="1.2" />
        <circle cx="12" cy="30" r="1.2" />
      </g>
      <path d="M12 8 Q6 4 4 10 Q10 10 12 12 Z" fill="#65a30d" />
      <path d="M12 8 Q18 4 20 10 Q14 10 12 12 Z" fill="#84cc16" />
    </svg>
  );
}

export function Wheat({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 20 60"
      width="18"
      height="54"
      className={`animate-wheat-sway ${className}`}
      style={{ animationDelay: `${delay}s`, transformOrigin: "50% 100%" }}
      aria-hidden
    >
      <path d="M10 60 L10 20" stroke="#a16207" strokeWidth="1.2" />
      <g fill="#eab308">
        <ellipse cx="10" cy="8" rx="2.4" ry="4" />
        <ellipse cx="6" cy="14" rx="2" ry="3.5" transform="rotate(-25 6 14)" />
        <ellipse cx="14" cy="14" rx="2" ry="3.5" transform="rotate(25 14 14)" />
        <ellipse cx="6" cy="22" rx="2" ry="3.5" transform="rotate(-25 6 22)" />
        <ellipse cx="14" cy="22" rx="2" ry="3.5" transform="rotate(25 14 22)" />
      </g>
    </svg>
  );
}

export function Worm({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 40 12"
      width="34"
      height="12"
      className={`animate-worm ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <path
        d="M2 6 Q10 0 20 6 T38 6"
        stroke="#f472b6"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="37" cy="6" r="1" fill="#111" />
    </svg>
  );
}

export function Barn({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" width="120" height="96" className={className} aria-hidden>
      <path d="M10 40 L50 12 L90 40 L90 44 L50 16 L10 44 Z" fill="#7c2d12" />
      <rect x="14" y="40" width="72" height="36" fill="#dc2626" />
      <path d="M14 40 L50 20 L86 40" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M50 20 L50 40" stroke="#fff" strokeWidth="2" />
      <rect x="42" y="52" width="16" height="24" fill="#78350f" />
      <path d="M50 52 L50 76" stroke="#fff" strokeWidth="1" />
      <rect x="22" y="48" width="10" height="10" fill="#fef3c7" stroke="#fff" strokeWidth="1" />
      <rect x="68" y="48" width="10" height="10" fill="#fef3c7" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

export function ChickenTrack({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      className={`animate-track ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <g stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M10 18 L10 8" />
        <path d="M10 10 L4 4" />
        <path d="M10 10 L16 4" />
        <path d="M10 10 L10 2" />
      </g>
    </svg>
  );
}

export function FeatherBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <Feather className="absolute left-[6%] top-0" delay={0} />
      <Feather className="absolute left-[28%] top-0" delay={5} />
      <Feather className="absolute left-[52%] top-0" delay={2} />
      <Feather className="absolute left-[74%] top-0" delay={7} />
      <Feather className="absolute left-[92%] top-0" delay={3} />
    </div>
  );
}
