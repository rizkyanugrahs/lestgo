import HomeHeader from "@/components/home/HomeHeader";
import NearestSlider from "@/components/home/NearestSlider";
import VisitedFeed from "@/components/home/VisitedFeed";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <HomeHeader />
      <NearestSlider />
      <VisitedFeed />
    </div>
  );
}
