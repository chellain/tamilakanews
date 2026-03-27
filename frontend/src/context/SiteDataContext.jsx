import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAllNews } from "../Api/newsApi";
import { getLayout } from "../Api/layoutApi";
import { getAdminConfig } from "../Api/adminApi";
import { getNewsPageConfig } from "../Api/newsPageApi";

const SiteDataContext = createContext(null);

const resolveEnglishParagraph = (box) => {
  if (!box || box.type !== "paragraph") return box;
  const english = box.contentEn;
  if (english == null || english === "") return box;
  return { ...box, content: english };
};

const buildTranslatedNews = (newsList) => {
  if (!Array.isArray(newsList)) return [];
  return newsList.map((news) => {
    const baseData = news?.data || {};
    const enData = news?.dataEn || {};
    const data = news?.dataEn ? { ...baseData, ...enData } : baseData;

    const fullContent = Array.isArray(news?.fullContent)
      ? news.fullContent.map(resolveEnglishParagraph)
      : news?.fullContent;

    const containerOverlays = Array.isArray(news?.containerOverlays)
      ? news.containerOverlays.map((container) => {
          if (!container?.settings?.boxes) return container;
          return {
            ...container,
            settings: {
              ...container.settings,
              boxes: container.settings.boxes.map(resolveEnglishParagraph),
            },
          };
        })
      : news?.containerOverlays;

    return {
      ...news,
      data,
      fullContent,
      containerOverlays,
    };
  });
};

export const SiteDataProvider = ({ children }) => {
  const [allNews, setAllNews] = useState([]);
  const [layout, setLayout] = useState(null);
  const [adminConfig, setAdminConfig] = useState(null);
  const [newsPageConfig, setNewsPageConfig] = useState(null);
  const [language, setLanguage] = useState("ta");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const [newsRes, layoutRes, adminRes, newsPageRes] = await Promise.allSettled([
      getAllNews(),
      getLayout(),
      getAdminConfig(),
      getNewsPageConfig(),
    ]);

    if (newsRes.status === "fulfilled" && Array.isArray(newsRes.value)) {
      setAllNews(newsRes.value);
    }

    if (layoutRes.status === "fulfilled") {
      setLayout(layoutRes.value || null);
    }

    if (adminRes.status === "fulfilled") {
      setAdminConfig(adminRes.value || null);
    }

    if (newsPageRes.status === "fulfilled") {
      setNewsPageConfig(newsPageRes.value || null);
    }

    if (
      newsRes.status === "rejected" ||
      layoutRes.status === "rejected" ||
      adminRes.status === "rejected" ||
      newsPageRes.status === "rejected"
    ) {
      setError("Failed to load site data.");
    }

    setLoading(false);

    if (typeof window !== "undefined" && window.snapSaveState) {
      window.snapSaveState();
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const translatedNews = useMemo(() => buildTranslatedNews(allNews), [allNews]);

  const updateNewsLocal = useCallback((newsId, updater) => {
    setAllNews((prev) =>
      prev.map((item) => {
        const matches =
          item?.id === newsId ||
          String(item?.id) === String(newsId) ||
          item?._id === newsId ||
          String(item?._id) === String(newsId);
        return matches ? updater(item) : item;
      })
    );
  }, []);

  const updateLayoutLocal = useCallback((updater) => {
    setLayout((prev) => (prev ? updater(prev) : prev));
  }, []);

  const value = {
    allNews,
    translatedNews,
    layout,
    adminConfig,
    newsPageConfig,
    language,
    setLanguage,
    setNewsPageConfig,
    updateNewsLocal,
    updateLayoutLocal,
    loading,
    error,
    refresh,
  };

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
};

export const useSiteData = () => {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }
  return ctx;
};
