import type { Metadata } from "next";
import { listBriefings } from "@/lib/briefings";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "투자 브리핑 비서",
  description: "삼성전자·애플 매일 아침 투자 브리핑",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const briefings = listBriefings();

  return (
    <html lang="ko">
      <body>
        <div className="layout">
          <Sidebar briefings={briefings} />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
