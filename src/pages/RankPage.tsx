import { PageMeta } from "../components/PageMeta";
import { RankPageClient } from "../components/RankPageClient";
import { useTierListContext } from "../hooks/useTierListContext";

export default function RankPage() {
  const { list } = useTierListContext();

  return (
    <div className="tier-page tier-page--rank">
      <PageMeta title={`Rank · ${list.name}`} description={list.rankLead} />
      <RankPageClient />
    </div>
  );
}
