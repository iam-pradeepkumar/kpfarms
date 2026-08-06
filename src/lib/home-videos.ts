import { supabase } from "@/integrations/supabase/client";

export type HomeVideoKey =
  | "home_video_digital"
  | "home_video_poultry"
  | "home_video_meeting"
  | "home_video_farm_visit"
  | "home_video_training"
  | "service_video_advice"
  | "service_video_farm_visit"
  | "service_video_shed_plan"
  | "service_video_shed_quote";

export const HOME_VIDEOS: { key: HomeVideoKey; label: string }[] = [
  { key: "service_video_advice", label: "Service 1: Poultry Farm Advice preview" },
  { key: "service_video_farm_visit", label: "Service 2: Farm Visit preview" },
  { key: "service_video_shed_plan", label: "Service 3: Shed Design Plan preview" },
  { key: "service_video_shed_quote", label: "Service 4: Shed Quotation preview" },
  { key: "home_video_meeting", label: "Online meeting preview" },
  { key: "home_video_farm_visit", label: "Farm Visit preview" },
  { key: "home_video_training", label: "Training Programs preview" },
  { key: "home_video_digital", label: "Digital Products preview" },
  { key: "home_video_poultry", label: "Poultry Products preview" },
];

const BUCKET = "site-assets";

/** Returns true if URL is a video (mp4, webm, mov, etc.), ignoring query string tokens. */
export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(clean)) return false;
  return /\.(mp4|webm|mov|avi|mkv|ogv|m4v)$/i.test(clean) || clean.includes("video");
}

async function signed(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

import { getPublicSiteSettings } from "./settings.functions";

/** Returns a map of video key -> playable URL (null when not uploaded). */
export async function getHomeVideoUrls(): Promise<Partial<Record<HomeVideoKey, string>>> {
  const keys = HOME_VIDEOS.map((v) => v.key);
  const data = await getPublicSiteSettings(keys);
  const out: Partial<Record<HomeVideoKey, string>> = {};
  for (const row of data ?? []) {
    const url = await signed((row as { value: string | null }).value);
    if (url) out[(row as { key: HomeVideoKey }).key] = url;
  }
  return out;
}

export async function uploadHomeVideo(key: HomeVideoKey, file: File): Promise<void> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${key}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (upErr) throw upErr;
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: path }, { onConflict: "key" });
  if (error) throw error;
}

export async function removeHomeVideo(key: HomeVideoKey): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: null }, { onConflict: "key" });
  if (error) throw error;
}
