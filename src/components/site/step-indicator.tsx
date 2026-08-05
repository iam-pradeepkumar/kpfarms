export function StepIndicator({
  step,
  labels,
}: {
  step: 1 | 2 | 3 | 4;
  labels: [string, string, string];
}) {
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = step > n || step === 4;
        const active = step === n;
        return (
          <li key={label} className="flex flex-col items-center gap-2 text-center">
            <div
              className={`flex size-9 items-center justify-center rounded-full text-xs font-extrabold transition ${
                done
                  ? "bg-kp-green text-white"
                  : active
                    ? "bg-kp-red text-white ring-4 ring-kp-red/20"
                    : "bg-stone-200 text-stone-500"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-widest ${
                active ? "text-kp-red" : done ? "text-kp-green" : "text-stone-500"
              }`}
            >
              {label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
