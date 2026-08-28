import { Outlet, useParams } from "react-router-dom";

import { getTierListBySlug } from "../lists";
import {
  TierListContext,
  createTierListContextValue,
} from "../hooks/useTierListContext";
import NotFoundPage from "./NotFoundPage";

export default function TierListLayout() {
  const { listSlug } = useParams<{ listSlug: string }>();
  const list = listSlug ? getTierListBySlug(listSlug) : undefined;

  if (!list) {
    return <NotFoundPage />;
  }

  return (
    <TierListContext.Provider value={createTierListContextValue(list)}>
      <Outlet />
    </TierListContext.Provider>
  );
}
