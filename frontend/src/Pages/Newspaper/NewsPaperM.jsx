import React from "react";
import Navbar from "./Components/Navbarr";
import { useState, useEffect } from "react";
import "./newspaper.scss";
import "./PreviewContainers/previewcont.css";
import Footer from "./Components/Footer";
import Sidebar from "./Components/Sidebar";
import PagePreview from "./Components2/PagePreview";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { buildSectionPath, sectionNameFromPath } from "../../utils/paths";
import { Helmet } from "react-helmet";
import { useSiteData } from "../../context/SiteDataContext";
import logo from "../../assets/logo1.png";

export default function NewsPaperM() {
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams();
  const { adminConfig } = useSiteData();
  const [isOn, setIsOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("tn_theme") === "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(() => {
    if (section) return sectionNameFromPath(section);
    return "main";
  });
  
  const themeStyle = {
    backgroundColor: isOn ? "#141414" : "#ffffff",
    color: isOn ? "#ffffff" : "#141414",
    transition: "all 0.3s ease",
    fontFamily: "Noto Sans Tamil",
  };

  // Apply dark/light to entire viewport so left/right margins are never white
  useEffect(() => {
    const bg = isOn ? "#141414" : "#ffffff";
    const fg = isOn ? "#ffffff" : "#141414";
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.style.color = fg;
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.documentElement.style.backgroundColor = "";
      document.documentElement.style.color = "";
    };
  }, [isOn]);

  // Persist theme across page switches
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tn_theme", isOn ? "dark" : "light");
  }, [isOn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("tn_activePage");
  }, []);

  useEffect(() => {
    const nextPage = section ? sectionNameFromPath(section) : "main";
    if (nextPage !== activePage) {
      setActivePage(nextPage);
    }
  }, [section]);

  useEffect(() => {
    const targetPath = buildSectionPath(activePage);
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [activePage, location.pathname, navigate]);

  const siteName = adminConfig?.siteName || "Tamilaka News";
  const pageLabel =
    activePage === "main" ? "Home" : activePage.replace(/-/g, " ");
  const pageTitle =
    activePage === "main" ? siteName : `${pageLabel} | ${siteName}`;
  const pageDescription =
    activePage === "main"
      ? "Latest news and updates from Tamil Nadu."
      : `Latest ${pageLabel} news and updates from Tamil Nadu.`;
  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const ogImage =
    typeof window !== "undefined"
      ? new URL(logo, window.location.origin).toString()
      : logo;

  return (
    <div style={{ ...themeStyle, width: "100%", minHeight: "100vh", margin: 0, padding: 0 }}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        {pageUrl && <meta property="og:url" content={pageUrl} />}
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="main-screen" style={{ ...themeStyle, backgroundColor: "transparent", maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        <Navbar
          setIsOn={setIsOn}
          isOn={isOn}
          openSidebar={() => setSidebarOpen(true)}
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          openSidebar={() => setSidebarOpen(true)}
          activePage={activePage}
          setActivePage={setActivePage}
          isOn={isOn}
          setIsOn={setIsOn}
        />
        
        <div className="np-main-cont-ov">
          <div className="ep-ed-full-cont">
            <br />
            {/* Render the active page preview from Redux */}
            <PagePreview pageName={activePage} />
          </div>
          
          <Footer onNavigatePage={(pageName) => setActivePage(pageName)} />
        </div>
      </div>
    </div>
  );
}
