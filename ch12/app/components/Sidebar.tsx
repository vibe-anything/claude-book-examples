"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BriefingMeta } from "@/lib/briefings";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatLabel(date: string): string {
  // 날짜 옆에 붙일 요일을 구한다. 시각을 한국 시간 정오로 정해 두면
  // 한국 시간으로 계산하든 서버 기본 시간(UTC)으로 계산하든 날짜가 하루 밀리지 않는다.
  const d = new Date(`${date}T12:00:00+09:00`);
  return `${date} (${WEEKDAYS[d.getDay()]})`;
}

export default function Sidebar({ briefings }: { briefings: BriefingMeta[] }) {
  const pathname = usePathname();
  const latestDate = briefings[0]?.date;

  return (
    <aside className="sidebar">
      <h1>투자 브리핑 비서</h1>
      <p className="subtitle">삼성전자 · 애플 · 매일 아침 7시 (KST)</p>

      <p className="nav-label">지난 브리핑</p>
      <ul className="nav-list">
        {briefings.map(({ date }) => {
          const href = `/briefings/${date}`;
          // 최신 브리핑은 첫 화면("/")에도 나온다. 그래서 첫 화면을 보고 있을 때도
          // 목록에서 최신 날짜를 선택된 것으로 표시한다.
          const isActive =
            pathname === href || (date === latestDate && pathname === "/");
          return (
            <li key={date}>
              <Link href={href} className={isActive ? "active" : undefined}>
                <span>{formatLabel(date)}</span>
                {date === latestDate && <span className="latest-tag">최신</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
