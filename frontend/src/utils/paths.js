export const trimToWords = (text, maxWords) => {
  if (!text) return "";
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!maxWords || maxWords <= 0) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
};

const stripDiacritics = (text) => {
  if (!text) return "";
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
};

export const toSlug = (text, maxWords = 8) => {
  const trimmed = trimToWords(text, maxWords);
  const normalized = stripDiacritics(trimmed);
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "news";
};

export const toSectionSlug = (name) => {
  if (!name) return "";
  const normalized = stripDiacritics(String(name).trim());
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

const normalizeCategory = (category) => {
  if (Array.isArray(category)) {
    const first = category.find((item) => item && String(item).trim().length > 0);
    return first || "";
  }
  return category || "";
};

export const getNewsCategory = (news) => {
  if (!news) return "";
  const fromData = news.data?.zonal ?? news.data?.category ?? news.data?.section ?? news.category;
  const fromDataEn = news.dataEn?.zonal ?? news.dataEn?.category ?? news.dataEn?.section;
  return normalizeCategory(fromData || fromDataEn);
};

export const buildNewsPath = (newsOrId, headline, options = {}) => {
  let title = "";
  let category = options.category;

  if (newsOrId && typeof newsOrId === "object") {
    title =
      newsOrId.data?.headline ||
      newsOrId.dataEn?.headline ||
      newsOrId.title ||
      headline ||
      "";
    if (!category) {
      category = getNewsCategory(newsOrId);
    }
  } else {
    title = headline || "";
  }

  const maxWords = options.maxWords ?? 8;
  const slug = toSlug(title, maxWords);
  const categorySlug = toSectionSlug(category) || "news";
  return `/news/${categorySlug}/${slug}`;
};

export const buildSectionPath = (name) => {
  const slug = toSectionSlug(name);
  if (!slug || slug === "main") return "/";
  return `/section/${slug}`;
};

export const sectionNameFromPath = (slug) => {
  if (!slug) return "main";
  return slug.replace(/-/g, " ").trim() || "main";
};
