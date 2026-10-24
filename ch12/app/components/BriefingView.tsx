import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Briefing } from "@/lib/briefings";

// 브리핑 파일 하나를 두 부분으로 나눈다. 맨 위의 제목과 작성 시각은 머리로 따로 떼고,
// `## 종목 이름`으로 시작하는 부분은 종목마다 카드 하나로 보여 주기 위해 하나씩 나눈다.
function splitBriefing(content: string) {
  const parts = content.split(/^(?=## )/m);
  const hasHead = !parts[0].startsWith("## ");
  return {
    head: hasHead ? parts[0] : "",
    stocks: hasHead ? parts.slice(1) : parts,
  };
}

export default function BriefingView({ briefing }: { briefing: Briefing }) {
  const { head, stocks } = splitBriefing(briefing.content);

  return (
    <article className="briefing">
      <div className="md head">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{head}</ReactMarkdown>
      </div>
      <div className="cards">
        {stocks.map((stock, i) => (
          <section key={i} className="card md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{stock}</ReactMarkdown>
          </section>
        ))}
      </div>
    </article>
  );
}
