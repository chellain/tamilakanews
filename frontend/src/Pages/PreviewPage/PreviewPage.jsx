import React, { useState, useMemo, useEffect } from "react";

import luffy from "../../assets/luffy.webp";
import newsimg from "../../assets/newsimg.avif";
import { IoSearchSharp, IoSettingsOutline, IoInformationCircleOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BiWorld } from "react-icons/bi";
import { GiHamburgerMenu } from "react-icons/gi";
import { HiMiniMoon } from "react-icons/hi2";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../Newspaper/Components/Footer";
import AutoScrollContainer from "../Newspaper/Components/AutoScrollContainer";
import BigNewsContainer4A from "../Newspaper/Containers_/BigContainer4A";
import BigNewsContainer4 from "../Newspaper/Containers_/BigContainer4";
import CommentSection from "./CommentSection";
import Navbarr from "../Newspaper/Components/Navbarr";
import Sidebar from "../Newspaper/Components/Sidebar";
import "../Newspaper/newspaper.scss";
import "../Newspaper/PreviewContainers/previewcont.css";
import "./Previewpge.scss";

import timeFun from "../Newspaper/Containers_/timeFun";
import AdBox from '../Newspaper/Components/AdBox';
import Newsheader from '../Newspaper/Components/Newsheader';
import Line from "../Newspaper/Components/Line";
import { useSiteData } from "../../context/SiteDataContext";
import { RxFontSize } from "react-icons/rx";
import { BiFontSize } from "react-icons/bi";
import {
  FaFacebookF,
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import BigNewsContainer4B from "../Newspaper/Containers_/BigContainer4B";
import PreviewNorContainer5 from "../Newspaper/PreviewContainers/PreviewNorContainer5";
import { updateNewsPageConfig } from "../../Api/newsPageApi";
import useProgressiveLoading from "../Shared/useProgressiveLoading";
import BrandLoader from "../Shared/BrandLoader";
import LazyImage, { ImageLoadProvider } from "../Shared/LazyImage";

export default function PreviewPage({ forcedNewsId = null, editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    allNews,
    translatedNews,
    language,
    newsPageConfig,
    adminConfig,
    setNewsPageConfig,
    loading,
  } = useSiteData();
  const allPages = adminConfig?.allPages || [];
  
  // Font size state - starts at 100% (base size)
  const [fontSize, setFontSize] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOn, setIsOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("tn_theme") === "dark";
  });

  const themeStyle = {
    backgroundColor: isOn ? "#141414" : "#ffffff",
    color: isOn ? "#ffffff" : "#141414",
    transition: "all 0.3s ease",
    fontFamily: "Noto Sans Tamil",
  };

  // Ensure full viewport (including side margins) follows dark/light mode
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

  const [showCopyToast, setShowCopyToast] = useState(false);

  const categoryList = useMemo(() => {
    const categories = Array.from(
      new Set(
        allPages
          .filter(
            (page) =>
              page?.name?.eng &&
              page.name.eng !== "Select District" &&
              !page.districts
          )
          .map((page) => page.name.eng)
      )
    );

    const fallbackCategories = ["politics", "cinema", "sports", "weather", "astrology"];
    return categories.length > 0 ? categories : fallbackCategories;
  }, [allPages]);

  const [editSection, setEditSection] = useState(null);
  const [modalState, setModalState] = useState({
    headerTam: "",
    headerEng: "",
    deliveryType: "shuffle",
    count: 5,
    category: "",
    selectedIds: [],
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const newsSource = language === "en" && translatedNews?.length ? translatedNews : allNews;
  const fallbackId = allNews.length > 0 ? allNews[0].id : null;
  const activeId = forcedNewsId ?? (id ? Number(id) : null) ?? fallbackId;
  const currentNews =
    newsSource.find((news) => news.id === Number(activeId)) ||
    allNews.find((news) => news.id === Number(activeId));
  const MLayout = 1;

  const filterNewsByCategory = (category, list) => {
    if (!category) return list;
    return list.filter((news) => {
      const zonal = news.data?.zonal;
      if (Array.isArray(zonal)) {
        return zonal.some(
          (cat) => String(cat).toLowerCase() === String(category).toLowerCase()
        );
      }
      if (typeof zonal === "string") {
        return zonal.trim().toLowerCase() === String(category).toLowerCase();
      }
      return false;
    });
  };

  const defaultHeaderBySection = (sectionKey) => {
    return sectionKey === "slider" ? "Top News" : "More News";
  };

  const resolveDisplayIds = (section, fallbackCount) => {
    const resolved =
      Array.isArray(section?.resolvedIds) && section.resolvedIds.length > 0
        ? section.resolvedIds
        : Array.isArray(section?.selectedIds) && section.selectedIds.length > 0
        ? section.selectedIds
        : [];

    if (resolved.length > 0) return resolved;

    const count = Number(section?.count || fallbackCount || 0);
    return allNews.slice(0, count).map((n) => n.id);
  };

  const sideConfig = newsPageConfig?.side || {};
  const sliderConfig = newsPageConfig?.slider || {};

  const sideHeaderText =
    (language === "en" ? sideConfig?.header?.eng : sideConfig?.header?.tam) ||
    defaultHeaderBySection("side");
  const sliderHeaderText =
    (language === "en" ? sliderConfig?.header?.eng : sliderConfig?.header?.tam) ||
    defaultHeaderBySection("slider");

  const sideIds = resolveDisplayIds(sideConfig, sideConfig?.count || 5);
  const sliderIds = resolveDisplayIds(sliderConfig, sliderConfig?.count || 6);

  const openSettings = (sectionKey) => {
    const section = sectionKey === "slider" ? sliderConfig : sideConfig;
    const fallbackCount = sectionKey === "slider" ? 6 : 5;

    setModalState({
      headerTam: section?.header?.tam || "",
      headerEng: section?.header?.eng || "",
      deliveryType: section?.deliveryType || "shuffle",
      count: section?.count || fallbackCount,
      category: section?.category || "",
      selectedIds: Array.isArray(section?.selectedIds) ? section.selectedIds : [],
    });
    setEditSection(sectionKey);
  };

  const closeSettings = () => {
    setEditSection(null);
  };

  const pickRandomIds = (category, count) => {
    const pool = filterNewsByCategory(category, allNews);
    const ids = pool.map((n) => n.id);

    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const handleSaveSection = async () => {
    if (!editSection) return;

    const fallbackCount = editSection === "slider" ? 6 : 5;
    const count = Math.max(1, Number(modalState.count || fallbackCount));

    const resolvedIds =
      modalState.deliveryType === "shuffle"
        ? pickRandomIds(modalState.category, count)
        : Array.isArray(modalState.selectedIds)
        ? modalState.selectedIds
        : [];

    const nextConfig = {
      side: sideConfig || {},
      slider: sliderConfig || {},
      [editSection]: {
        ...(editSection === "slider" ? sliderConfig : sideConfig),
        header: {
          tam: modalState.headerTam || "",
          eng: modalState.headerEng || "",
        },
        deliveryType: modalState.deliveryType,
        count,
        category: modalState.category || "",
        selectedIds: Array.isArray(modalState.selectedIds) ? modalState.selectedIds : [],
        resolvedIds,
      },
    };

    try {
      const updated = await updateNewsPageConfig(nextConfig);
      setNewsPageConfig(updated);
      setEditSection(null);
    } catch (error) {
      console.error("Failed to update newspage settings:", error);
      alert("Failed to update newspage settings. Please try again.");
    }
  };
  
  const safeNews = currentNews || { data: {}, dataEn: {}, fullContent: [], containerOverlays: [] };
  const isEnglish = language === "en";
  const baseData = safeNews.data || {};
  const displayData = isEnglish
    ? { ...baseData, ...(safeNews.dataEn || {}) }
    : baseData;

  const pickArray = (...candidates) => {
    for (const item of candidates) {
      if (Array.isArray(item)) return item;
    }
    return [];
  };

  const fullContent = pickArray(
    isEnglish ? currentNews.dataEn?.fullContent : null,
    isEnglish ? currentNews.data?.fullContent : null,
    isEnglish ? currentNews.fullContentEn : null,
    currentNews.data?.fullContent,
    currentNews.fullContent
  );

  const containerOverlays = pickArray(
    isEnglish ? currentNews.dataEn?.containerOverlays : null,
    isEnglish ? currentNews.data?.containerOverlays : null,
    isEnglish ? currentNews.containerOverlaysEn : null,
    currentNews.data?.containerOverlays,
    currentNews.containerOverlays
  );
  const totalContentItems = fullContent.length + containerOverlays.length;

  const {
    showBrandLoader,
    brandFading,
    visibleCount,
    showSkeletons,
    canLoadImages,
  } = useProgressiveLoading({
    totalItems: totalContentItems,
    initialBatch: 2,
    batchSize: 2,
    enable: true,
  });

  if (loading) {
    return <div style={{ padding: 40 }}>Loading news...</div>;
  }

  if (!currentNews) {
    return <div style={{ padding: 40 }}>No news selected for preview.</div>;
  }

  const visibleFullCount = Math.min(fullContent.length, visibleCount);
  const visibleContainerCount = Math.max(0, visibleCount - fullContent.length);
  const remainingFullCount = Math.max(0, fullContent.length - visibleFullCount);
  const remainingContainerCount = Math.max(0, containerOverlays.length - visibleContainerCount);

  const thumb = (() => {
    if (!displayData?.thumbnail) return { url: luffy, isVideo: false };

    let url = null;
    let isVideo = false;

    if (typeof displayData.thumbnail === "string") {
      url = displayData.thumbnail;
      isVideo =
        displayData.thumbnail.includes(".mp4") ||
        displayData.thumbnail.includes(".webm") ||
        displayData.thumbnail.includes(".ogg") ||
        displayData.thumbnail.startsWith("data:video/");
    } else if (displayData.thumbnail instanceof File) {
      url = URL.createObjectURL(displayData.thumbnail);
      isVideo = displayData.thumbnail.type?.startsWith("video/");
    }

    return {
      url: url || luffy,
      isVideo,
    };
  })();

  const pageUrl =
    typeof window !== "undefined" && currentNews?.id != null
      ? `${window.location.origin}/news/${currentNews.id}`
      : "";

  const resolveAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (typeof window === "undefined") return url;
    try {
      return new URL(url, window.location.origin).toString();
    } catch (error) {
      return url;
    }
  };

  const shareImage = (() => {
    const candidate = thumb.isVideo ? displayData?.thumbnail : thumb.url;
    if (
      !candidate ||
      (typeof candidate === "string" &&
        (candidate.startsWith("blob:") || candidate.startsWith("data:")))
    ) {
      return resolveAbsoluteUrl(luffy);
    }
    return resolveAbsoluteUrl(candidate);
  })();

  const shareTitle = displayData?.headline || "Tamilaka News";
  const shareDescription =
    displayData?.oneLiner || "Latest trending news from Tamil Nadu.";

  useEffect(() => {
    if (typeof document === "undefined" || !pageUrl) return;

    const upsertMeta = (attr, key, content) => {
      const selector = `meta[${attr}="${key}"]`;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    document.title = `${shareTitle} | Tamilaka News`;
    upsertMeta("property", "og:title", shareTitle);
    upsertMeta("property", "og:description", shareDescription);
    upsertMeta("property", "og:image", shareImage);
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("property", "og:type", "article");
    upsertMeta("property", "og:site_name", "Tamilaka News");
  }, [pageUrl, shareTitle, shareDescription, shareImage]);

  const handleCopyLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setShowCopyToast(true);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = pageUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShowCopyToast(true);
    }
  };

  useEffect(() => {
    if (!showCopyToast) return;
    const timer = window.setTimeout(() => setShowCopyToast(false), 2000);
    return () => window.clearTimeout(timer);
  }, [showCopyToast]);

  const shareLinks = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(
        `${shareTitle}\n${pageUrl}`
      )}`,
      icon: <FaWhatsapp />,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        pageUrl
      )}`,
      icon: <FaFacebookF />,
    },
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareTitle
      )}&url=${encodeURIComponent(pageUrl)}`,
      icon: <FaXTwitter />,
    },
  ];

  // Font size control functions
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 150)); // Max 150%
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 70)); // Min 70%
  };

  const handleNavigatePage = (pageName) => {
    const nextPage = String(pageName || "main").toLowerCase();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tn_activePage", nextPage);
    }
    navigate("/");
  };

  const renderSkeletonStack = (count) =>
    Array.from({ length: count }).map((_, idx) => (
      <div key={`skeleton-${idx}`} className="skeleton-card skeleton">
        <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton skeleton-block" />
      </div>
    ));

  return (
    <>
      <BrandLoader show={showBrandLoader} fading={brandFading} />
      <ImageLoadProvider canLoad={canLoadImages}>
        <div className={`prepge-main${isOn ? " dark" : ""}`} style={{ ...themeStyle, minHeight: "100vh" }}>
          <div className="pp-nav-ov">
            <Navbarr
              setIsOn={setIsOn}
              isOn={isOn}
              openSidebar={() => setSidebarOpen(true)}
              setActivePage={handleNavigatePage}
            />
          </div>
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            openSidebar={() => setSidebarOpen(true)}
            isOn={isOn}
            setIsOn={setIsOn}
            setActivePage={handleNavigatePage}
          />
          {showCopyToast && (
            <div className="copy-toast" role="status" aria-live="polite">
              <IoInformationCircleOutline />
              <span>News has copied</span>
            </div>
          )}
          <div>
            <br />
          </div>

      <div className="Prevpge-main-con1">
        <div className="premain-con1-sub">
          <div className="main-news-cont">
            <div className="main-news-sbcon1" style={{ fontSize: `${fontSize}%` }}>
              <div className="mannsw-sc-head">{displayData.headline}</div>
              <div className="mannsw-sc-oneliner">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{displayData.oneLiner}
              </div>
              {!currentNews.hiddenElements?.thumbnail && (
                <div className="mannsw-sc-tmbnl">
                  {thumb.isVideo ? (
                    <video
                      src={thumb.url}
                      controls
                      controlsList="nodownload"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <LazyImage
                      src={thumb.url}
                      alt="thumbnail"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </div>
              )}
              <div className="mannsw-sc-time">
                {timeFun(currentNews.time || currentNews.createdAt || currentNews.updatedAt) || "No date available"}
              </div>
              <div className="preview-action-bar">
                <div className="preview-action-group">
                  {shareLinks.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className={`preview-icon-btn share-btn ${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Share on ${item.label}`}
                      title={`Share on ${item.label}`}
                    >
                      {item.icon}
                    </a>
                  ))}
                  <button
                    type="button"
                    className="preview-icon-btn share-btn copy"
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                    title="Copy link"
                  >
                    <FaLink />
                  </button>
                </div>
                <div className="preview-action-group">
                  <button
                    type="button"
                    className="preview-icon-btn font-btn"
                    onClick={decreaseFontSize}
                    aria-label="Decrease font size"
                    title="Decrease font size"
                  >
                    <RxFontSize />
                  </button>
                  <button
                    type="button"
                    className="preview-icon-btn font-btn"
                    onClick={increaseFontSize}
                    aria-label="Increase font size"
                    title="Increase font size"
                  >
                    <BiFontSize />
                  </button>
                </div>
              </div>
            </div>

            {/* Render outside container boxes first */}
            {showSkeletons && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {renderSkeletonStack(Math.max(1, Math.min(2, totalContentItems)))}
              </div>
            )}

            {!showSkeletons && visibleFullCount > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  fontSize: `${fontSize}%`,
                }}
              >
                {fullContent.slice(0, visibleFullCount).map((box) => (
                  <div key={box.id}>
                    {box.type === "paragraph" ? (
                      <ParagraphResponsive box={box} />
                    ) : box.type === "image" ? (
                      <ImageResponsive box={box} />
                    ) : box.type === "video" ? (
                      <VideoResponsive box={box} isMobile={isMobile} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {!showSkeletons && remainingFullCount > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {renderSkeletonStack(remainingFullCount)}
              </div>
            )}

            {/* Render containers with responsive design */}
            <div
              className="main-news-content"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                fontSize: `${fontSize}%`,
              }}
            >
              {showSkeletons && renderSkeletonStack(Math.max(1, Math.min(2, totalContentItems)))}

              {!showSkeletons && visibleContainerCount > 0 && (
                <>
                  {containerOverlays.slice(0, visibleContainerCount).map((container) => (
                    <ContainerView 
                      key={container.id} 
                      container={container} 
                      isMobile={isMobile}
                      fontSizePercent={fontSize}
                    />
                  ))}
                </>
              )}

              {!showSkeletons && remainingContainerCount > 0 && renderSkeletonStack(remainingContainerCount)}

              {!showSkeletons && containerOverlays.length === 0 && fullContent.length === 0 && (
                <div style={{ padding: "20px", color: "#999", textAlign: "center" }}>
                  No content available
                </div>
              )}
            </div>
            
            <div className="comment-sec">
              <CommentSection 
                newsId={currentNews.id} 
                comments={currentNews.comments || []} 
              />
            </div>  
          </div>

          {MLayout === 1 && !isMobile && <Line direction="V" length="1250px" thickness="1px" color="#e80d8c" />}
          {MLayout === 1 && (
            <Melumnews
              headerName={sideHeaderText}
              newsIds={sideIds}
              editMode={editMode}
              onOpenSettings={() => openSettings("side")}
            />
          )}
        </div>
      </div>
       <div className="mannsw-ns-header">
         <div className="mannswns-nd-o2">
           <div className="npe-header-row">
             <Newsheader name={sliderHeaderText} />
             {editMode && (
               <button
                 className="npe-settings-btn"
                 onClick={() => openSettings("slider")}
                 type="button"
               >
                 <IoSettingsOutline />
               </button>
             )}
           </div>
         </div>
       </div>
      <div className="footer-overlay">
        
        <div className="npmc-c3">
          <AutoScrollContainer gap={0} autoScrollDelay={10000} autoTranslateX={310} manualTranslateX={310}>
            {sliderIds.map((newsId, idx) => (
              <BigNewsContainer4B
                key={`${newsId}-${idx}`}
                newsId={newsId}
                imgHeight={200}
                imgWidth={300}
              />
            ))}
          </AutoScrollContainer>
        </div>
        <Footer/>
      </div>
          {editMode && (
            <NewsSectionEditModal
              open={!!editSection}
              sectionKey={editSection}
              onClose={closeSettings}
              categoryList={categoryList}
              modalState={modalState}
              setModalState={setModalState}
              allNews={allNews}
              newsSource={newsSource}
              onSave={handleSaveSection}
              filterNewsByCategory={filterNewsByCategory}
            />
          )}
        </div>
      </ImageLoadProvider>
    </>
  );
}

// New component to render containers responsively
function ContainerView({ container, isMobile, fontSizePercent = 100 }) {
  // The container structure from Redux is: { id, settings: { columns, gap, padding, boxes } }
  const settings = container.settings || container; // Handle both structures
  
  // Adjust columns for mobile - if more than 1 column, make it 1 on mobile
  const responsiveColumns = isMobile && settings.columns > 1 ? 1 : settings.columns;
  
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
        gap: `${settings.gap}px`,
        padding: `${settings.padding}px`,
        fontSize: `${fontSizePercent}%`,
      }}
    >
      {settings.boxes && settings.boxes.length > 0 ? (
        settings.boxes.map((box) => (
          <div key={box.id}>
            {box.type === "paragraph" ? (
              <ParagraphResponsive box={box} />
            ) : box.type === "image" ? (
              <ImageResponsive box={box} />
            ) : box.type === "video" ? (
              <VideoResponsive box={box} isMobile={isMobile} />
            ) : null}
          </div>
        ))
      ) : (
        <div style={{ 
          gridColumn: `span ${responsiveColumns}`, 
          textAlign: "center", 
          color: "#999", 
          padding: "20px" 
        }}>
          No content in this container
        </div>
      )}
    </div>
  );
}

function NewsCard({
  title = "Sample title",
  image = newsimg,
  time = "5hrs ago",
}) {
  return (
    <div style={{ width: 400, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>{title}</div>
        <LazyImage
          src={image}
          style={{ width: 120, height: 80, objectFit: "cover" }}
          alt="news"
        />
      </div>
      <div style={{ fontSize: 10, color: "gray" }}>{time}</div>
      <div style={{ height: 1, backgroundColor: "#ffb8e5ff" }}></div>
    </div>
  );
}

function AdvertisementBox({ width = "300px", height = "250px" }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#555",
        fontSize: "14px",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        borderRadius: "4px",
      }}
    >
      Advertisement here
    </div>
  );
}

function Melumnews({ headerName, newsIds = [], editMode = false, onOpenSettings }) {
  return (
    <>
      <div className="mens-side-news">
        <div>
          <AdvertisementBox width="100%" height="100px" />
        </div>
        <div className="mens-morenews">
          <div className="npe-header-row">
            <Newsheader name={headerName} />
            {editMode && (
              <button
                className="npe-settings-btn"
                onClick={onOpenSettings}
                type="button"
              >
                <IoSettingsOutline />
              </button>
            )}
          </div>
        </div>
        <div className="mens-in-cont">
          {newsIds.length === 0 && (
            <div className="npe-empty">No news selected.</div>
          )}
          {newsIds.map((newsId, idx) => (
            <React.Fragment key={`${newsId}-${idx}`}>
              <PreviewNorContainer5 newsId={newsId} version={2} />
              {idx < newsIds.length - 1 && (
                <Line direction="H" length="100%" thickness="0.5px" color="#b6b6b6ff" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

function NewsSectionEditModal({
  open,
  sectionKey,
  onClose,
  categoryList,
  modalState,
  setModalState,
  allNews,
  newsSource,
  onSave,
  filterNewsByCategory,
}) {
  if (!open) return null;

  const sectionTitle =
    sectionKey === "slider" ? "Slider Settings" : "Sidebar (Melum News) Settings";

  const isShuffle = modalState.deliveryType === "shuffle";
  const isCustom = modalState.deliveryType === "custom";

  const categoryNews = modalState.category
    ? filterNewsByCategory(modalState.category, allNews)
    : allNews;

  const getDisplayHeadline = (news) => {
    const display = newsSource?.find((n) => n.id === news.id) || news;
    return display?.data?.headline || "Untitled News";
  };

  const toggleSelected = (newsId) => {
    setModalState((prev) => {
      const selected = new Set(prev.selectedIds || []);
      if (selected.has(newsId)) {
        selected.delete(newsId);
      } else {
        selected.add(newsId);
      }
      return { ...prev, selectedIds: Array.from(selected) };
    });
  };

  return (
    <div className="npe-modal-overlay" onClick={onClose}>
      <div className="npe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="npe-modal-header">
          <div className="npe-modal-title">{sectionTitle}</div>
          <button className="npe-icon-btn" onClick={onClose} type="button">
            X
          </button>
        </div>

        <div className="npe-form">
          <div className="npe-form-row">
            <div className="npe-field">
              <label>Header text (Tamil)</label>
              <input
                className="npe-input"
                type="text"
                value={modalState.headerTam}
                onChange={(e) =>
                  setModalState((prev) => ({ ...prev, headerTam: e.target.value }))
                }
                placeholder="Tamil header"
              />
            </div>
            <div className="npe-field">
              <label>Header text (English)</label>
              <input
                className="npe-input"
                type="text"
                value={modalState.headerEng}
                onChange={(e) =>
                  setModalState((prev) => ({ ...prev, headerEng: e.target.value }))
                }
                placeholder="English header"
              />
            </div>
          </div>

          <div className="npe-form-row">
            <div className="npe-field">
              <label>Content delivery type</label>
              <select
                className="npe-input"
                value={modalState.deliveryType}
                onChange={(e) =>
                  setModalState((prev) => ({
                    ...prev,
                    deliveryType: e.target.value,
                  }))
                }
              >
                <option value="shuffle">Shuffle</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {isShuffle && (
              <div className="npe-field">
                <label>Count</label>
                <input
                  className="npe-input"
                  type="number"
                  min="1"
                  value={modalState.count}
                  onChange={(e) =>
                    setModalState((prev) => ({
                      ...prev,
                      count: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          <div className="npe-form-row">
            <div className="npe-field">
              <label>Category</label>
              <select
                className="npe-input"
                value={modalState.category}
                onChange={(e) =>
                  setModalState((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCustom && (
            <div className="npe-news-picker">
              <div className="npe-picker-title">
                Choose news from the selected category
              </div>
              {!modalState.category && (
                <div className="npe-empty">Select a category to list news.</div>
              )}
              {modalState.category && (
                <div className="npe-news-list">
                  {categoryNews.length === 0 && (
                    <div className="npe-empty">No news in this category.</div>
                  )}
                  {categoryNews.map((news) => (
                    <label key={news.id} className="npe-news-item">
                      <input
                        type="checkbox"
                        checked={(modalState.selectedIds || []).includes(news.id)}
                        onChange={() => toggleSelected(news.id)}
                      />
                      <span>{getDisplayHeadline(news)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {isShuffle && (
            <div className="npe-hint">
              Shuffle will pick a random set of news from the selected category.
            </div>
          )}
        </div>

        <div className="npe-modal-actions">
          <button className="npe-secondary-btn" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="npe-primary-btn" onClick={onSave} type="button">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ParagraphResponsive({ box }) {
  return (
    <div
      className="preview-paragraph-responsive"
      style={{
        padding: "12px",
        background: "transparent",
        borderRadius: "6px",
      }}
    >
      <p 
        style={{ 
          whiteSpace: "pre-wrap",
          fontSize: "1em",
          lineHeight: "1.6",
          margin: 0,
          color: "inherit",
        }}
      >
        {box.content}
      </p>
    </div>
  );
}

function ImageResponsive({ box }) {
  const resolveImageSrc = (content) => {
    if (!content) return newsimg;
    if (content instanceof File) {
      return URL.createObjectURL(content);
    }
    if (typeof content === "string") {
      // Blob URLs are session-bound and break on refresh. Use a safe fallback.
      if (content.startsWith("blob:")) return newsimg;
      return content;
    }
    return newsimg;
  };

  const [imgSrc, setImgSrc] = React.useState(() => resolveImageSrc(box?.content));

  return (
    <div
      className="preview-image-responsive"
      style={{
        width: "100%",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <LazyImage
        src={imgSrc}
        alt="news"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "cover",
        }}
        onError={() => setImgSrc(newsimg)}
      />
    </div>
  );
}

function VideoResponsive({ box, isMobile = false }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const videoData = box.videoData || null;

  // Nothing to render if no video has been configured yet
  if (!videoData) return null;

  // On desktop: render at exactly the pixel width the author set in the template.
  // On mobile: collapse to 100% of the available column (responsive).
  const authorWidth    = box.dimensions?.width || 560;
  const containerWidth = isMobile ? "100%" : `${authorWidth}px`;

  // Aspect ratio: device videos may be portrait; YouTube is always 16:9.
  const aspectRatio    = 16 / 9;
  const paddingBottom  = `${(1 / aspectRatio) * 100}%`;

  return (
    <div
      className="preview-video-responsive"
      style={{
        // Desktop: exact author-set pixel width.
        // Mobile: fluid 100% so it fits the narrower column.
        width: containerWidth,
        // Safety net — never overflow parent if column is narrower than author width.
        maxWidth: "100%",
        margin: "0 auto",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* ── Thumbnail + play button (shown before the user presses play) ── */}
      {!isPlaying && (
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom,
            background: "#000",
            cursor: "pointer",
          }}
          onClick={() => setIsPlaying(true)}
        >
          {videoData.thumbnail && (
            <LazyImage
              src={videoData.thumbnail}
              alt="video thumbnail"
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {/* Play button overlay */}
          <div
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "72px", height: "72px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              transition: "transform 0.2s",
            }}
          >
            {/* inline SVG play triangle — no icon library needed */}
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="#333"
              style={{ marginLeft: "4px" }}
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Actual player (shown after play is pressed) ── */}
      {isPlaying && (
        <div style={{ position: "relative", width: "100%", paddingBottom }}>
          {videoData.type === "youtube" ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoData.videoId}?autoplay=1`}
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                border: "none",
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video"
            />
          ) : (
            <video
              src={videoData.videoUrl}
              controls
              autoPlay
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                objectFit: "contain",
              }}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
