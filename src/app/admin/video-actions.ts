"use server";

import { requireAdmin } from "./actions";
import { BUNNY_TUS_ENDPOINT, type UploadTicket, type VideoState, createUploadTicket, getVideoState } from "@/lib/bunny";

export async function startVideoUpload(title: string): Promise<({ ok: true; endpoint: string } & UploadTicket) | { ok: false; error: string }> {
  await requireAdmin();
  try {
    return { ok: true, endpoint: BUNNY_TUS_ENDPOINT, ...(await createUploadTicket(title)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nie udało się zacząć wgrywania." };
  }
}

export async function checkVideo(videoId: string): Promise<VideoState> {
  await requireAdmin();
  return getVideoState(videoId);
}
