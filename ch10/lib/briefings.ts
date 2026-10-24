import fs from "node:fs";
import path from "node:path";

// 대시보드가 보여 줄 브리핑은 프로젝트 폴더의 briefings/ 안에 있는 .md 파일이다.
// 프로젝트 폴더가 곧 앱 폴더이므로, 앱이 실행되는 폴더 바로 아래의 briefings/를 가리킨다.
const BRIEFINGS_DIR = path.join(process.cwd(), "briefings");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type BriefingMeta = {
  /** 파일 이름에서 뽑은 날짜(예: 2026-07-24) */
  date: string;
};

export type Briefing = BriefingMeta & {
  /** 브리핑 파일에 적힌 마크다운 내용 전체 */
  content: string;
};

/**
 * briefings/에 있는 브리핑의 날짜 목록을 최신 날짜부터 돌려준다.
 * 이름이 날짜 형식(예: 2026-07-24.md)이 아닌 파일은 건너뛰고, 폴더가 없으면 빈 목록을 돌려준다.
 */
export function listBriefings(): BriefingMeta[] {
  if (!fs.existsSync(BRIEFINGS_DIR)) return [];

  return fs
    .readdirSync(BRIEFINGS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .filter((name) => DATE_RE.test(name))
    .sort()
    .reverse()
    .map((date) => ({ date }));
}

/** 날짜 하나를 받아 그날의 브리핑을 돌려준다. 날짜 형식이 아니거나 파일이 없으면 null을 돌려준다. */
export function getBriefing(date: string): Briefing | null {
  if (!DATE_RE.test(date)) return null;

  const file = path.join(BRIEFINGS_DIR, `${date}.md`);
  if (!fs.existsSync(file)) return null;

  return { date, content: fs.readFileSync(file, "utf8") };
}

/** 가장 최근 날짜의 브리핑을 돌려준다. 브리핑이 하나도 없으면 null을 돌려준다. */
export function getLatestBriefing(): Briefing | null {
  const [latest] = listBriefings();
  return latest ? getBriefing(latest.date) : null;
}
