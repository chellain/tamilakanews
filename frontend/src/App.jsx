
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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

  // Safety: never block the UI indefinitely if APIs hang.
  useEffect(() => {
    if (!loading || !showBrandLoader) return;
    const timer = setTimeout(() => {
      setBrandFading(true);
      setShowBrandLoader(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading, showBrandLoader]);

  return (
    <>
      <BrandLoader show={showBrandLoader} fading={brandFading} />
      <BrowserRouter>
        <LegacyHashRedirect />
        <Routes>
          <Route path="/" element={<NewsPaperM />} />
          <Route path="/section/:section" element={<NewsPaperM />} />
          <Route path="/preview/:category/:slug?" element={<PreviewPage />} />
          <Route path="/news/:category/:slug?" element={<PreviewPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function LegacyHashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawHash = window.location.hash || "";
    if (!rawHash.startsWith("#/")) return;

    const target = rawHash.slice(1);
    if (!target || target === location.pathname) return;

    navigate(target, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

export default App;

