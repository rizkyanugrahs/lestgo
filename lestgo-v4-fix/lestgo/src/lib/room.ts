import { supabase } from "./supabase";
import type { Room } from "./types";

const STORAGE_KEY = "lestgo_room";
const CODE_PREFIX = "LGO-";
const CODE_DIGITS = 4;

export type StoredRoom = Pick<Room, "id" | "code">;

export function getStoredRoom(): StoredRoom | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredRoom) : null;
  } catch {
    return null;
  }
}

export function storeRoom(room: StoredRoom) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
}

export function clearStoredRoom() {
  localStorage.removeItem(STORAGE_KEY);
}

const randomCode = () =>
  CODE_PREFIX + String(Math.floor(Math.random() * 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0");

/** Creates a new room. If the code collides, it retries automatically. */
export async function createRoom(): Promise<StoredRoom> {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("rooms").insert({ code: randomCode() }).select("id, code").single();
    if (data) return data;
    if (error?.code !== "23505") throw new Error(error?.message ?? "Failed to create the room.");
  }
  throw new Error("Couldn't generate a unique code. Please try again.");
}

/** Accepts "LGO-1234", "lgo1234" or just "1234". */
export async function joinRoom(input: string): Promise<StoredRoom> {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== CODE_DIGITS) throw new Error(`Enter the ${CODE_DIGITS}-digit code.`);
  const { data, error } = await supabase
    .from("rooms").select("id, code").eq("code", CODE_PREFIX + digits).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No room found with that code.");
  return data;
}
