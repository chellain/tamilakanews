import font1Url from "../assets/Fonts/font_1.TTF";
import font2Url from "../assets/Fonts/font_2.ttf";
import font3Url from "../assets/Fonts/font_3.TTF";
import font4Url from "../assets/Fonts/font_4.TTF";

export const DEFAULT_TAMIL_FONT = "default";

const FALLBACK_TAMIL_STACK = `"Noto Sans Tamil", "Latha", "Nirmala UI", sans-serif`;

export const TAMIL_FONT_OPTIONS = [
  {
    id: DEFAULT_TAMIL_FONT,
    label: "Default Font",
    family: "Noto Sans Tamil",
    description: "Use the website's existing Tamil font stack.",
  },
  {
    id: "font_1",
    label: "Font 1",
    family: "TamilakaCustomFont1",
    url: font1Url,
    description: "Custom Tamil font from font_1.ttf.",
  },
  {
    id: "font_2",
    label: "Font 2",
    family: "TamilakaCustomFont2",
    url: font2Url,
    description: "Custom Tamil font from font_2.ttf.",
  },
  {
    id: "font_3",
    label: "Font 3",
    family: "TamilakaCustomFont3",
    url: font3Url,
    description: "Custom Tamil font from font_3.ttf.",
  },
  {
    id: "font_4",
    label: "Font 4",
    family: "TamilakaCustomFont4",
    url: font4Url,
    description: "Custom Tamil font from font_4.ttf.",
  },
];

export const normalizeTamilFontId = (fontId) =>
  TAMIL_FONT_OPTIONS.some((font) => font.id === fontId)
    ? fontId
    : DEFAULT_TAMIL_FONT;

export const getTamilFontFamily = (fontId) => {
  const safeFontId = normalizeTamilFontId(fontId);
  const selected = TAMIL_FONT_OPTIONS.find((font) => font.id === safeFontId);

  if (!selected || selected.id === DEFAULT_TAMIL_FONT) {
    return FALLBACK_TAMIL_STACK;
  }

  return `"${selected.family}", ${FALLBACK_TAMIL_STACK}`;
};

export const ensureTamilFontFaces = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("tamilaka-custom-font-faces")) return;

  const style = document.createElement("style");
  style.id = "tamilaka-custom-font-faces";
  style.textContent = TAMIL_FONT_OPTIONS
    .filter((font) => font.url)
    .map(
      (font) => `
@font-face {
  font-family: "${font.family}";
  src: url("${font.url}") format("truetype");
  font-display: swap;
  unicode-range: U+0B80-0BFF;
}`
    )
    .join("\n");

  document.head.appendChild(style);
};
