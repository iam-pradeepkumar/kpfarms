# KP Farm Ventures — Build Plan

The uploaded spec covers ~15 feature areas: multi-page marketing site, 3 booking flows (consultation / farm visit / training), digital + physical + affiliate stores, payments with manual admin verification, WhatsApp/email notifications, and a full admin dashboard with reports. This is a multi-phase build. I recommend shipping it in 4 phases so you can review at each step.

## Phase 1 — Public site skeleton (frontend only, no backend)

Build every page from the main menu with static content and animations, keeping the vibrant-agrarian style already on the home page.

Routes to create:

- `/products-services` — service cards with auto-play-on-scroll promo video slots
- `/digital-products` — product grid (image, preview, price, offer price, Buy Now)
- `/poultry-products` — tabs for "Affiliate" (Buy on Amazon) and "Own Products" with categories/subcategories
- `/consultation` — service overview + "Book Consultation" entry
- `/farm-visit` — visit info + "Book Visit" entry
- `/training` — upcoming training events list
- `/about`, `/testimonials`, `/blog`, `/contact` — content pages
- Global: WhatsApp chat button, Call Now button, footer with social + policy links, FAQ section on home
- Refactor nav from home into a shared component; add mobile hamburger menu

Deliverable: fully navigable, mobile-responsive marketing site. No data persistence yet.

## Phase 2 — Backend + user auth + bookings (Lovable Cloud)

Enable Lovable Cloud (Supabase under the hood) and add:

- User auth: email + OTP-style (Supabase magic link initially; true mobile OTP requires SMS provider — call out later)
- Tables: `profiles`, `user_roles`, `services`, `digital_products`, `physical_products`, `product_categories`, `training_events`, `consultation_bookings`, `farm_visit_bookings`, `training_bookings`, `orders`, `blog_posts`, `testimonials`
- Booking flows for consultation, farm visit, training with date/time slot picker; blocked-date logic; slot uniqueness enforcement
- Registered-user dashboard: booking history, order history, purchased digital-product downloads
- Guest checkout supported

## Phase 3 — Payments + admin verification + notifications

- Payment upload flow: show UPI QR / GPay / PhonePe details, customer uploads screenshot OR transaction ID (Cloud Storage bucket)
- Admin verification queue with Approve / Reject / Reschedule
- On approval: auto-generate meeting link field (Google Meet/Zoom/Teams — admin selectable), send WhatsApp + email confirmation, schedule reminders (24h / 1h / 5m) via a scheduled edge function
- WhatsApp integration: requires a provider (Twilio, Gupshup, WATI, or Meta Cloud API). I'll need you to pick one and provide API credentials.
- Email: transactional via Resend (Lovable AI Gateway ready) — no extra key needed

## Phase 4 — Admin dashboard + reports + polish

- `/admin` protected route (role-based via `user_roles`), pages for products, services, videos, prices, bookings, customers, payments, orders, blogs, testimonials, training events
- Dashboard tiles: visitors, registrations, orders, monthly revenue, pending payments, upcoming consultations/visits/trainings
- Reports (filter by date/month/year), export to Excel + PDF
- SEO: unique title/description per route, sitemap, Google Analytics + Search Console tags
- FAQ, newsletter, product reviews & ratings, wishlist, coupon codes, invoice generation — "Additional Recommendations" from §17

## Out of scope / needs your input before building

- **WhatsApp API provider** — pick one; API costs money and needs credentials
- **True mobile-number OTP login** — needs SMS provider (Twilio/MSG91); magic-link email works out-of-the-box otherwise
- **Real UPI payment gateway** — spec says manual screenshot verification, which I'll build. If you later want auto-verification, we'd integrate Razorpay/Paddle.
- **GST invoicing, multi-language (EN/TA/HI), AI chatbot, mobile app** — listed as "Future Expansion", I'll skip unless you say otherwise.
- **Videos** — spec wants auto-play promo videos per service/product. I'll wire up `<video>` slots; you'll provide the mp4 URLs later (or we host on Lovable Cloud Storage).

## Suggested next step

Start with **Phase 1** in this turn — build out all public pages with the existing visual style so you can see the full site shape. Then in the next turn, enable Lovable Cloud for Phase 2. Confirm and I'll proceed with Phase 1.
