
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import PreviewPage from "./Pages/PreviewPage/PreviewPage";
import NewsPaperM from "./Pages/Newspaper/NewsPaperM";
import BrandLoader from "./Pages/Shared/BrandLoader";
import { SiteDataProvider, useSiteData } from "./context/SiteDataContext";

function App() {
  return (
    <SiteDataProvider>
      <AppContent />
    </SiteDataProvider>
  );
}

function AppContent() {
  const { loading } = useSiteData();
  const [showBrandLoader, setShowBrandLoader] = useState(true);
  const [brandFading, setBrandFading] = useState(false);

  // Keep the brand loader visible until the initial site data has loaded.
  useEffect(() => {
    if (!loading) {
      setBrandFading(true);
      const timer = setTimeout(() => setShowBrandLoader(false), 600);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <>
      <BrandLoader show={showBrandLoader} fading={brandFading} />
      <HashRouter>
        <Routes>
          <Route path="/" element={<NewsPaperM />} />
          <Route path="/section/:section" element={<NewsPaperM />} />
          <Route path="/preview/:category/:slug?" element={<PreviewPage />} />
          <Route path="/news/:category/:slug?" element={<PreviewPage />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;

