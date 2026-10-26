export type Pin = {
  id: string;
  kind: "wish" | "visited";
  title: string;
  subtitle: string | null;
  lat: number;
  lng: number;
  category: string | null;
  photo: string | null;
  rating: number | null;
  date: string | null;
};
