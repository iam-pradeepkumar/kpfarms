import { supabase } from "@/integrations/supabase/client";
import { pingAdminPush } from "@/lib/push-ping";

type BookingTable = "consultation_bookings" | "farm_visit_bookings" | "training_bookings";
export type BookingKind = "consultation" | "farm_visit" | "training";
export type BookingStep = "registered" | "slot_booked" | "paid";

export type ResumedBooking = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  booking_step: BookingStep | null;
  payment_reference: string | null;
  topic?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  visit_date?: string | null;
  group_size?: number | null;
  program?: string | null;
  cohort_date?: string | null;
  notes?: string | null;
};

export async function resumeBooking(
  kind: BookingKind,
  whatsapp: string,
): Promise<ResumedBooking | null> {
  const wa = whatsapp.trim();
  if (!wa) return null;
  const { data, error } = await supabase.rpc("resume_booking", {
    _kind: kind,
    _whatsapp: wa,
  });
  if (error || !data) return null;
  return data as unknown as ResumedBooking;
}

const LS_PREFIX = "kp_booking_wa_";
export function rememberBookingWhatsapp(kind: BookingKind, whatsapp: string) {
  try {
    if (whatsapp.trim()) localStorage.setItem(LS_PREFIX + kind, whatsapp.trim());
  } catch {
    /* ignore */
  }
}
export function getRememberedBookingWhatsapp(kind: BookingKind): string | null {
  try {
    return localStorage.getItem(LS_PREFIX + kind);
  } catch {
    return null;
  }
}
export function clearBookingWhatsapp(kind: BookingKind) {
  try {
    localStorage.removeItem(LS_PREFIX + kind);
  } catch {
    /* ignore */
  }
}

/* ---------------- Step 1: register (via SECURITY DEFINER RPC) ---------------- */

export async function registerConsultation(data: {
  name: string;
  whatsapp: string;
  email?: string;
  topic?: string;
}) {
  const { data: id, error } = await supabase.rpc("register_consultation", {
    _name: data.name,
    _whatsapp: data.whatsapp,
    _email: data.email ?? null,
    _topic: data.topic ?? null,
  } as never);
  if (!error) pingAdminPush();
  return { id: (id as unknown as string) ?? null, error };
}

export async function registerFarmVisit(data: { name: string; whatsapp: string; email?: string }) {
  const { data: id, error } = await supabase.rpc("register_farm_visit", {
    _name: data.name,
    _whatsapp: data.whatsapp,
    _email: data.email ?? null,
  } as never);
  if (!error) pingAdminPush();
  return { id: (id as unknown as string) ?? null, error };
}

export async function registerTraining(data: {
  name: string;
  whatsapp: string;
  email?: string;
  program?: string;
  cohort_date?: string;
}) {
  const { data: id, error } = await supabase.rpc("register_training", {
    _name: data.name,
    _whatsapp: data.whatsapp,
    _email: data.email ?? null,
    _program: data.program ?? null,
    _cohort_date: data.cohort_date ?? null,
  } as never);
  if (!error) pingAdminPush();
  return { id: (id as unknown as string) ?? null, error };
}

/* ---------------- Step 2: slot (via ownership-checked RPC) ---------------- */

export async function saveConsultationSlot(
  id: string,
  whatsapp: string,
  data: {
    preferred_date?: string;
    preferred_time?: string;
    notes?: string;
  },
) {
  const { data: ok, error } = await supabase.rpc("update_consultation_slot", {
    _id: id,
    _whatsapp: whatsapp.trim(),
    _preferred_date: data.preferred_date ?? null,
    _preferred_time: data.preferred_time ?? null,
    _notes: data.notes ?? null,
  } as never);
  if (!error && ok) pingAdminPush();
  return { error: error ?? (ok ? null : new Error("Booking not found")) };
}

export async function saveFarmVisitSlot(
  id: string,
  whatsapp: string,
  data: {
    visit_date?: string;
    group_size?: number;
    notes?: string;
  },
) {
  const { data: ok, error } = await supabase.rpc("update_farm_visit_slot", {
    _id: id,
    _whatsapp: whatsapp.trim(),
    _visit_date: data.visit_date ?? null,
    _group_size: data.group_size ?? null,
    _notes: data.notes ?? null,
  } as never);
  if (!error && ok) pingAdminPush();
  return { error: error ?? (ok ? null : new Error("Booking not found")) };
}

export async function saveTrainingSlot(
  id: string,
  whatsapp: string,
  data: {
    cohort_date?: string;
    notes?: string;
  },
) {
  const { data: ok, error } = await supabase.rpc("update_training_slot", {
    _id: id,
    _whatsapp: whatsapp.trim(),
    _cohort_date: data.cohort_date ?? null,
    _notes: data.notes ?? null,
  } as never);
  if (!error && ok) pingAdminPush();
  return { error: error ?? (ok ? null : new Error("Booking not found")) };
}

/* ---------------- Step 3: payment (via ownership-checked RPC) ---------------- */

export async function savePayment(
  kind: BookingKind,
  id: string,
  whatsapp: string,
  data: { payment_reference?: string },
) {
  const { data: ok, error } = await supabase.rpc("mark_booking_paid", {
    _kind: kind,
    _id: id,
    _whatsapp: whatsapp.trim(),
    _payment_reference: data.payment_reference ?? null,
  } as never);
  if (!error && ok) pingAdminPush();
  return { error: error ?? (ok ? null : new Error("Booking not found")) };
}

/* ---------------- Other forms ---------------- */

export async function submitContact(data: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const res = await supabase.from("contact_messages").insert(data);
  if (!res.error) pingAdminPush();
  return res;
}

export async function submitOrder(data: {
  product_id: string;
  quantity: number;
  customer_name: string;
  whatsapp: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const { error } = await supabase.rpc("submit_order", {
    _product_id: data.product_id,
    _quantity: data.quantity,
    _customer_name: data.customer_name,
    _whatsapp: data.whatsapp,
    _email: data.email ?? null,
    _address: data.address ?? null,
    _notes: data.notes ?? null,
  } as never);
  if (!error) pingAdminPush();
  return { error };
}

export type TestimonialRow = {
  id: string;
  name: string;
  place: string | null;
  rating: number;
  text: string | null;
  media_type: "text" | "photo" | "video" | "audio";
  media_url: string | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  created_at: string;
};

export async function submitTestimonial(data: {
  name: string;
  place?: string;
  rating: number;
  text?: string;
}) {
  return supabase.from("testimonials").insert({
    name: data.name,
    place: data.place || null,
    rating: data.rating,
    text: data.text?.trim() ? data.text.trim() : null,
    media_type: "text",
    status: "pending",
  });
}

export async function resolveTestimonialMediaUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data } = await supabase.storage.from("testimonials").createSignedUrl(value, 60 * 60);
  return data?.signedUrl ?? null;
}

/* ---------------- Payment QR + screenshot proof ---------------- */

export const PAYMENT_QR_KEY = "payment_qr_path";

export async function getPaymentQrUrl(): Promise<string | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", PAYMENT_QR_KEY)
    .maybeSingle();
  const path = data?.value;
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data: signed } = await supabase.storage
    .from("site-assets")
    .createSignedUrl(path, 60 * 60);
  return signed?.signedUrl ?? null;
}

export async function uploadPaymentProof(
  kind: BookingKind,
  id: string,
  whatsapp: string,
  file: File,
): Promise<{ error: Error | null }> {
  const wa = whatsapp.trim();

  // Proves this uploader really owns the booking: the token is only returned
  // when the booking id and WhatsApp number match.
  const { data: token, error: tokenErr } = await supabase.rpc("proof_upload_token", {
    _kind: kind,
    _id: id,
    _whatsapp: wa,
  } as never);
  if (tokenErr || !token) {
    return { error: (tokenErr as unknown as Error) ?? new Error("Booking not found") };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${kind}/${id}-${token as unknown as string}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { error: upErr as unknown as Error };

  const { data: ok, error } = await supabase.rpc("submit_payment_proof", {
    _kind: kind,
    _id: id,
    _whatsapp: wa,
    _screenshot_path: path,
  } as never);
  return { error: (error as unknown as Error) ?? (ok ? null : new Error("Booking not found")) };
}

export type BookingStatus = {
  id: string;
  name: string;
  whatsapp: string;
  booking_step: BookingStep | null;
  status: string | null;
  meeting_link: string | null;
  confirmed_at: string | null;
};

export async function getBookingStatus(
  kind: BookingKind,
  whatsapp: string,
): Promise<BookingStatus | null> {
  const wa = whatsapp.trim();
  if (!wa) return null;
  const { data, error } = await supabase.rpc("booking_status", { _kind: kind, _whatsapp: wa });
  if (error || !data) return null;
  return data as unknown as BookingStatus;
}

export async function resolvePaymentProofUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

import { getPublicSiteSettings } from "./settings.functions";

export const ADMIN_WHATSAPP_KEY = "admin_whatsapp";

/** Digits-only WhatsApp number of the admin, e.g. "919876543210". */
export async function getAdminWhatsapp(): Promise<string | null> {
  const data = await getPublicSiteSettings([ADMIN_WHATSAPP_KEY]);
  const row = data?.[0];
  const num = toWaDigits(row?.value ?? "");
  return num || null;
}

export function buildOrderWhatsappText(o: {
  product: string;
  quantity: number;
  total?: number | null;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}) {
  const lines = [
    "*New order — KP Farm Ventures*",
    `Product: ${o.product}`,
    `Quantity: ${o.quantity}`,
    o.total ? `Total: ₹${o.total}` : "",
    "",
    `Name: ${o.name}`,
    `WhatsApp: ${o.phone}`,
    o.email ? `Email: ${o.email}` : "",
    `Address: ${o.address}`,
    o.notes ? `Notes: ${o.notes}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Turns any phone number the customer typed into a WhatsApp-ready number.
 * Adds India's 91 code when it is missing and drops spaces, +, and leading zeros
 * so confirmation messages never fail with "wrong country code".
 */
export function toWaDigits(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/[^0-9]/g, "");
  if (!d) return "";
  d = d.replace(/^0+/, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length > 12 && d.startsWith("0091")) return d.slice(2);
  return d;
}
