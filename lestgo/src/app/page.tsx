import HomeHeader from "@/components/home/HomeHeader";
import NearestSlider from "@/components/home/NearestSlider";
import MemoryFeed from "@/components/home/MemoryFeed";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <HomeHeader />
      <NearestSlider />
      <MemoryFeed />
    </div>
  );
}
