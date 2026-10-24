import { getLatestBriefing } from "@/lib/briefings";
import BriefingView from "./components/BriefingView";

export default function HomePage() {
  const latest = getLatestBriefing();

  if (!latest) {
    return (
      <div className="empty">
        <h1>브리핑 없음</h1>
        <p>briefings/ 폴더에 YYYY-MM-DD.md 파일을 추가하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return <BriefingView briefing={latest} />;
}
