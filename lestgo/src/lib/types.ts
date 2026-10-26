export type Room = { id: string; code: string; anniversary_date: string | null; partner_status: string | null };

export type Idea = {
  id: string; folder_id: string; room_id: string; title: string; notes: string | null;
  link: string | null; location_name: string | null; latitude: number | null; longitude: number | null;
  is_visited: boolean; cover_url: string | null; created_at: string;
};

export type Memory = {
  id: string; room_id: string; place_name: string; photo_url: string;
  visit_date: string; rating: number | null; notes: string | null; created_at: string;
  category: string | null; latitude: number | null; longitude: number | null;
};
