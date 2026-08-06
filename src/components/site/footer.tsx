import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { KpMark } from "./kp-mark";
import { useAdminWhatsapp } from "@/lib/site-contact";
import { SOCIAL_LINKS } from "@/lib/social-links";

function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.99 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
    </svg>
  );
}

function SocialDot({
  label,
  href,
  hoverClass,
  Icon,
}: {
  label: string;
  href: string;
  hoverClass: string;
  Icon: ComponentType<{ size?: number }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition-colors hover:text-white ${hoverClass}`}
    >
      <Icon size={18} />
    </a>
  );
}

export function SiteFooter() {
  const { display: waDisplay, waLink } = useAdminWhatsapp();
  return (
    <footer className="relative z-10 border-t border-stone-200 bg-white px-6 py-14 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <KpMark size={40} />
              <div className="font-display text-lg font-extrabold uppercase tracking-tight">
                <span className="text-kp-green">KP</span> <span className="text-kp-red">Farm</span>{" "}
                <span className="text-kp-green">Ventures</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              Helping poultry farmers grow with advice, training, digital products, and farm visits.
            </p>
            <div className="mt-5 flex gap-3">
              <SocialDot
                label="Instagram"
                href={SOCIAL_LINKS.instagram}
                hoverClass="hover:bg-[#E1306C]"
                Icon={Instagram}
              />
              <SocialDot
                label="YouTube"
                href={SOCIAL_LINKS.youtube}
                hoverClass="hover:bg-[#FF0000]"
                Icon={Youtube}
              />
              <SocialDot
                label="WhatsApp"
                href={waLink}
                hoverClass="hover:bg-[#25D366]"
                Icon={WhatsAppGlyph}
              />
              <SocialDot
                label="Facebook"
                href={SOCIAL_LINKS.facebook}
                hoverClass="hover:bg-[#1877F2]"
                Icon={Facebook}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-800">
              Explore
            </div>
            <ul className="space-y-2 text-sm text-stone-500">
              <li>
                <Link to="/products-services" className="hover:text-kp-green">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/digital-products" className="hover:text-kp-green">
                  Digital Products
                </Link>
              </li>
              <li>
                <Link to="/poultry-products" className="hover:text-kp-green">
                  Farm Products
                </Link>
              </li>
              <li>
                <Link to="/training" className="hover:text-kp-green">
                  Training Programs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-800">
              Company
            </div>
            <ul className="space-y-2 text-sm text-stone-500">
              <li>
                <Link to="/about" className="hover:text-kp-green">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-kp-green">
                  Reviews
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-kp-green">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-kp-green">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-800">
              Get in touch
            </div>
            <ul className="space-y-2 text-sm text-stone-500">
              <li>📞 {waDisplay || "—"}</li>
              <li>✉️ hello@kpfarmventures.in</li>
              <li>📍 Tamil Nadu, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-6 text-xs uppercase tracking-widest text-stone-400 md:flex-row">
          <div>
            © {new Date().getFullYear()} KP Farm Ventures · Growing the Future of Poultry Farming
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-kp-green">
              Privacy
            </a>
            <a href="#" className="hover:text-kp-green">
              Terms
            </a>
            <a href="#" className="hover:text-kp-green">
              Amazon Links Notice
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
