import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { KpMark } from "./kp-mark";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkBase =
    "relative px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:text-kp-green";
  const activeCls = {
    className:
      "text-kp-green font-semibold before:absolute before:inset-x-3 before:-bottom-0.5 before:h-0.5 before:rounded-full before:bg-kp-green",
  };

  return (
    <>
      {/* spacer so page content isn't hidden under the floating nav */}
      <div aria-hidden className="h-24 md:h-28" />

      <nav
        className={`fixed inset-x-0 top-3 z-50 px-3 md:top-5 md:px-6 transition-all duration-300 ${
          scrolled ? "md:top-3" : ""
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/60 bg-white/70 pl-3 pr-3 py-2 backdrop-blur-xl transition-all duration-300 md:pl-5 ${
            scrolled
              ? "shadow-[0_10px_40px_-12px_rgba(20,83,45,0.25)] ring-1 ring-kp-green/10"
              : "shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)]"
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 pl-1">
            <span className="relative flex items-center justify-center">
              <span className="pointer-events-none absolute inset-0 -m-1 rounded-full bg-gradient-to-tr from-kp-green/20 via-kp-gold/20 to-kp-red/20 blur-md" />
              <KpMark size={38} />
            </span>
            <span className="font-display text-base font-extrabold uppercase tracking-tight md:text-[17px]">
              <span className="text-kp-green">KP</span> <span className="text-kp-red">Farm</span>{" "}
              <span className="text-kp-green">Ventures</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            <Link
              to="/"
              className={linkBase}
              activeProps={activeCls}
              activeOptions={{ exact: true }}
            >
              Home
            </Link>
            <Link to="/products-services" className={linkBase} activeProps={activeCls}>
              Services
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <Link
                to="/digital-products"
                className={`${linkBase} inline-flex items-center gap-1`}
                activeProps={activeCls}
              >
                Products
                <ChevronDown
                  size={14}
                  className={`transition-transform ${productsOpen ? "rotate-180" : ""}`}
                />
              </Link>
              {productsOpen && (
                <div className="absolute left-1/2 top-full z-40 min-w-56 -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                    <Link
                      to="/digital-products"
                      onClick={() => setProductsOpen(false)}
                      className="block px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-kp-green/5 hover:text-kp-green"
                    >
                      Digital Products
                    </Link>
                    <Link
                      to="/poultry-products"
                      onClick={() => setProductsOpen(false)}
                      className="block border-t border-stone-100 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-kp-green/5 hover:text-kp-green"
                    >
                      Farm Products
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setBookingOpen(true)}
              onMouseLeave={() => setBookingOpen(false)}
            >
              <Link
                to="/consultation"
                className={`${linkBase} inline-flex items-center gap-1`}
                activeProps={activeCls}
              >
                Meeting &amp; Visit
                <ChevronDown
                  size={14}
                  className={`transition-transform ${bookingOpen ? "rotate-180" : ""}`}
                />
              </Link>
              {bookingOpen && (
                <div className="absolute left-1/2 top-full z-40 min-w-60 -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                    <Link
                      to="/consultation"
                      onClick={() => setBookingOpen(false)}
                      className="block px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-kp-green/5 hover:text-kp-green"
                    >
                      Book Meeting Call
                    </Link>
                    <Link
                      to="/farm-visit"
                      onClick={() => setBookingOpen(false)}
                      className="block border-t border-stone-100 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-kp-green/5 hover:text-kp-green"
                    >
                      Book Farm Visit
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/training" className={linkBase} activeProps={activeCls}>
              Training
            </Link>
            <Link to="/blog" className={linkBase} activeProps={activeCls}>
              Blog
            </Link>
            <Link to="/about" className={linkBase} activeProps={activeCls}>
              About
            </Link>
          </div>

          <div className="hidden items-center lg:flex">
            <Link
              to="/consultation"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-kp-green px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:shadow-xl hover:shadow-green-900/30"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative size-1.5 rounded-full bg-kp-gold animate-pulse" />
              <span className="relative">Book Now</span>
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            className="rounded-full border border-stone-200 bg-white p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl lg:hidden">
            <div className="flex flex-col px-5 py-3">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
                activeProps={{ className: "text-kp-green font-semibold" }}
                activeOptions={{ exact: true }}
              >
                Home
              </Link>
              <Link
                to="/products-services"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
                activeProps={{ className: "text-kp-green font-semibold" }}
              >
                Services
              </Link>
              <div className="flex items-center justify-between">
                <Link
                  to="/digital-products"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
                >
                  Products
                </Link>
                <button
                  type="button"
                  aria-label="Toggle products submenu"
                  onClick={() => setMobileProductsOpen((v) => !v)}
                  className="p-2 text-stone-500"
                  aria-expanded={mobileProductsOpen}
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {mobileProductsOpen && (
                <div className="ml-3 flex flex-col border-l border-stone-200 pl-3">
                  <Link
                    to="/digital-products"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm font-medium text-stone-600 hover:text-kp-green"
                  >
                    Digital Products
                  </Link>
                  <Link
                    to="/poultry-products"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm font-medium text-stone-600 hover:text-kp-green"
                  >
                    Farm Products
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Link
                  to="/consultation"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
                >
                  Meeting &amp; Farm Visit
                </Link>
                <button
                  type="button"
                  aria-label="Toggle consultation submenu"
                  onClick={() => setMobileBookingOpen((v) => !v)}
                  className="p-2 text-stone-500"
                  aria-expanded={mobileBookingOpen}
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileBookingOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {mobileBookingOpen && (
                <div className="ml-3 flex flex-col border-l border-stone-200 pl-3">
                  <Link
                    to="/consultation"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm font-medium text-stone-600 hover:text-kp-green"
                  >
                    Book Meeting Call
                  </Link>
                  <Link
                    to="/farm-visit"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm font-medium text-stone-600 hover:text-kp-green"
                  >
                    Book Farm Visit
                  </Link>
                </div>
              )}
              <Link
                to="/training"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
              >
                Training Programs
              </Link>
              <Link
                to="/blog"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
              >
                Blog & Articles
              </Link>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-stone-700 hover:text-kp-green"
              >
                About Us
              </Link>

              <Link
                to="/consultation"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex justify-center rounded-full bg-kp-green px-5 py-2.5 text-sm font-bold text-white"
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
