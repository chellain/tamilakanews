import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";
import { buildNewsPath } from "./src/utils/paths.js";

const SITE_NAME = "Tamilaka News";
const DEFAULT_LANG = "ta";

const escapeXml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const resolveNewsDate = (news) =>
  news?.time || news?.createdAt || news?.updatedAt || null;

const resolveNewsTitle = (news) =>
  news?.data?.headline || news?.dataEn?.headline || news?.title || "News";

const resolveApiUrl = (baseUrl) => {
  const apiBase = process.env.VITE_API_BASE_URL || "/api";
  if (apiBase.startsWith("http")) {
    return `${apiBase.replace(/\/$/, "")}/news`;
  }
  const safeBase = baseUrl.replace(/\/$/, "");
  return `${safeBase}${apiBase}/news`;
};

const resolveNewsUrl = (baseUrl, news) => {
  const safeBase = baseUrl.replace(/\/$/, "");
  const pathPart = buildNewsPath(news);
  return `${safeBase}${pathPart}`;
};

const buildNewsSitemapXml = ({
  baseUrl,
  items,
  siteName = SITE_NAME,
  language = DEFAULT_LANG,
}) => {
  const urls = items
    .map((news) => {
      const title = resolveNewsTitle(news);
      const publishedRaw = resolveNewsDate(news);
      if (!publishedRaw) return null;
      const publishedDate = new Date(publishedRaw).toISOString();
      const loc = resolveNewsUrl(baseUrl, news);
      return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>${escapeXml(language)}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(publishedDate)}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
    </news:news>
  </url>`;
    })
    .filter(Boolean)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
};

const fetchNewsItems = async (apiUrl) => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

const sitemapPlugin = () => ({
  name: "news-sitemap",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/sitemap.xml") return next();
      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5173";
      const baseUrl = `${proto}://${host}`;
      const apiUrl = resolveApiUrl(baseUrl);
      const newsItems = await fetchNewsItems(apiUrl);
      const latest = newsItems
        .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
        .slice(0, 100);
      const xml = buildNewsSitemapXml({ baseUrl, items: latest });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.end(xml);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/sitemap.xml") return next();
      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:4173";
      const baseUrl = `${proto}://${host}`;
      const apiUrl = resolveApiUrl(baseUrl);
      const newsItems = await fetchNewsItems(apiUrl);
      const latest = newsItems
        .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
        .slice(0, 100);
      const xml = buildNewsSitemapXml({ baseUrl, items: latest });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.end(xml);
    });
  },
  async closeBundle() {
    const siteBaseUrl =
      process.env.SITE_BASE_URL ||
      process.env.VITE_SITE_BASE_URL ||
      "http://localhost:5173";
    const apiUrl = resolveApiUrl(siteBaseUrl);
    const newsItems = await fetchNewsItems(apiUrl);
    const latest = newsItems
      .sort((a, b) => new Date(resolveNewsDate(b) || 0) - new Date(resolveNewsDate(a) || 0))
      .slice(0, 100);
    const xml = buildNewsSitemapXml({ baseUrl: siteBaseUrl, items: latest });
    const outDir = path.resolve(process.cwd(), "build");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "sitemap.xml"), xml, "utf-8");
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  build: {
    outDir: "build",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
})
