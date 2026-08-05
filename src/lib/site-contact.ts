import { useEffect, useState } from "react";
import { getAdminWhatsapp, toWaDigits } from "@/lib/submissions";

/** Strip the country code so only the local number is shown (e.g. 9876543210). */
export function localWhatsappNumber(digits: string | null): string {
  if (!digits) return "";
  const d = digits.replace(/[^0-9]/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}

/**
 * Admin WhatsApp number kept in sync with the number set in the admin dashboard.
 * `digits` keeps the country code (for wa.me links), `display` shows only the number.
 */
export function useAdminWhatsapp() {
  const [digits, setDigits] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAdminWhatsapp()
      .then((n) => {
        if (alive) setDigits(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return {
    digits,
    display: localWhatsappNumber(digits),
    waLink: digits ? `https://wa.me/${digits}` : "https://wa.me/",
  };
}

export { toWaDigits };
