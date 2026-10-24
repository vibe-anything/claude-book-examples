import { notFound } from "next/navigation";
import { getBriefing, listBriefings } from "@/lib/briefings";
import BriefingView from "../../components/BriefingView";

export function generateStaticParams() {
  return listBriefings().map(({ date }) => ({ date }));
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const briefing = getBriefing(date);

  if (!briefing) notFound();

  return <BriefingView briefing={briefing} />;
}
