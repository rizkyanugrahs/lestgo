export type Room = { id: string; code: string; anniversary_date: string | null; partner_status: string | null; couple_photo_url?: string | null };

export type ChecklistItem = { id: string; text: string; completed: boolean };

export type PersonKey = "kiky" | "safina";

export type Place = {
  id: string;
  room_id: string;
  title: string;
  description: string | null;
  category: string;
  status: "wishlist" | "visited";
  planned_date: string | null;
  visited_date: string | null;
  location_name: string | null;
  gmaps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  social_link: string | null;
  checklist: ChecklistItem[];
  rating: number | null;
  photos: string[];
  is_comfort_pick: boolean;
  comfort_pick_by: PersonKey | null;
  created_at: string;
};
