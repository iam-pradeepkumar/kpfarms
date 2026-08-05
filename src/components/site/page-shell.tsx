import type { ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteNav } from "./nav";
import { SiteFooter } from "./footer";
import { FloatingActions } from "./floating-actions";
import { FeatherBackdrop } from "./decor";
import { MeetingReminder } from "./meeting-reminder";

function BackButton() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-6 md:px-10">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 shadow-sm backdrop-blur transition-all hover:-translate-x-0.5 hover:border-kp-green hover:text-kp-green"
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 font-sans text-stone-900">
      <FeatherBackdrop />
      <SiteNav />
      <BackButton />
      <main className="relative z-10">{children}</main>
      <SiteFooter />
      <FloatingActions />
      <MeetingReminder />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  accent,
  desc,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  desc: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 to-transparent px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-kp-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-kp-gold">
          <span className="size-1.5 rounded-full bg-kp-gold" />
          {eyebrow}
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
          {title}
          {accent && (
            <>
              {" "}
              <span className="text-kp-green">{accent}</span>
            </>
          )}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">{desc}</p>
      </div>
    </section>
  );
}
