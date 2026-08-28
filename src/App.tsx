import { Route, Routes } from "react-router-dom";

import Navigation from "./components/layout/Navigation";
import CommunityPage from "./pages/CommunityPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import RankPage from "./pages/RankPage";
import SharePage from "./pages/SharePage";
import TierListLayout from "./pages/TierListLayout";

import "./App.css";
import "./styles/tier-list.css";

export default function App() {
  return (
    <div className="app-viewport-shell">
      <Navigation />
      <div className="app-nav-spacer" aria-hidden="true" />
      <div id="app-main-scroll" className="app-main-scroll">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:listSlug" element={<TierListLayout />}>
            <Route index element={<CommunityPage />} />
            <Route path="rank" element={<RankPage />} />
            <Route path="r/:id" element={<SharePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}
