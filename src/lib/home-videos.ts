import { supabase } from "@/integrations/supabase/client";

export type HomeVideoKey =
  | "home_video_digital"
  | "home_video_poultry"
  | "home_video_meeting"
  | "home_video_farm_visit"
  | "home_video_training";

export const HOME_VIDEOS: { key: HomeVideoKey; label: string }[] = [
  { key: "home_video_digital", label: "Digital Products preview" },
  { key: "home_video_poultry", label: "Poultry Products preview" },
  { key: "home_video_meeting", label: "Online meeting preview" },
  { key: "home_video_farm_visit", label: "Farm Visit preview" },
  { key: "home_video_training", label: "Training Programs preview" },
];

const BUCKET = "site-assets";

async function signed(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Returns a map of video key -> playable URL (null when not uploaded). */
export async function getHomeVideoUrls(): Promise<Partial<Record<HomeVideoKey, string>>> {
  const keys = HOME_VIDEOS.map((v) => v.key);
  const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
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
