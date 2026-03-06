import React from "react";

export default function BrandLoader({ show, fading }) {
  if (!show) return null;

  const isDark =
    typeof window !== "undefined" &&
    window.localStorage.getItem("tn_theme") === "dark";

  return (
    <div
      className={`brand-loader-overlay${isDark ? "" : ""}${
        fading ? " fade-out" : ""
      }`}
    >
      <div className="brand-loader-letter">த</div>
    </div>
  );
}
