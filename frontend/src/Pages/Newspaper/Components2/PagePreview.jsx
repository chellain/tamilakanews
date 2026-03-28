import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import PreviewContainer from "./PreviewContainer";
import PreviewSlider from "./PreviewSlider";
import { useSiteData } from "../../../context/SiteDataContext";
import { findPageByName } from "../../../context/layoutHelpers";
import useProgressiveLoading from "../../Shared/useProgressiveLoading";
import BrandLoader from "../../Shared/BrandLoader";
import { ImageLoadProvider } from "../../Shared/LazyImage";


// ─────────────────────────────────────────────────────────────────────────────
// MobileContext
// Consumed by PreviewContainer, NestedContainer overlays, and any child that
// needs to collapse its internal grid to a single column on small screens.
//
// Usage in child components:
//   import { useMobile } from "./PagePreview";
//   const isMobile = useMobile();
// ─────────────────────────────────────────────────────────────────────────────
export const MobileContext = createContext(false);
export const useMobile = () => useContext(MobileContext);

/** Breakpoint in px below which we treat the viewport as "mobile". */
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const handler = (e) => setIsMobile(e.matches);

    // Modern API
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      // Safari < 14 fallback
      mq.addListener(handler);
    }

    // Sync in case the value changed between render and effect
    setIsMobile(mq.matches);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
}

export default function PagePreview({ pageName = "main" }) {
  const isMobile = useIsMobile();
  const { layout, loading, enqueueNewsSummaries } = useSiteData();
  const currentPage = useMemo(
    () => findPageByName(layout, pageName),
    [layout, pageName]
  );

  const containers = currentPage?.containers || [];
  const sliders = currentPage?.sliders || [];
  const lines = currentPage?.lines || [];
  const pageSettings = currentPage?.settings || {
    height: 600,
    gridColumns: 12,
    gap: 10,
    padding: 20,
  };

  const initialBatch = 3;
  const batchSize = 3;
  const skeletonTotal = loading ? 6 : containers.length;

  const {
    showBrandLoader,
    brandFading,
    phase,
    visibleCount,
    showSkeletons,
    canLoadImages,
  } = useProgressiveLoading({
    totalItems: skeletonTotal,
    initialBatch,
    batchSize,
    enable: true,
  });

  const padding = pageSettings.padding ?? 20;

  // ── Responsive overrides ──────────────────────────────────────────────────
  // On mobile:
  //   • Collapse the outer grid to a single column.
  //   • Let height be auto so all stacked containers are visible.
  //   • Lines are hidden (see below).
  const effectiveGridColumns = isMobile ? 1 : pageSettings.gridColumns;
  const effectiveHeight = isMobile ? "auto" : `${pageSettings.height}px`;
  const effectivePadding = isMobile ? "12px" : `${padding}px`;
  const renderCount = Math.min(visibleCount, containers.length);
  const visibleContainers = containers.slice(0, renderCount);
  const remainingCount = Math.max(0, containers.length - renderCount);

  const extractTimestamp = (item) => {
    if (item?.slotId) {
      const match = item.slotId.match(/slot_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    if (item?.id) {
      const match = item.id.toString().match(/_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  };

  const collectSliderIds = (slider) => {
    if (!slider?.items || slider.items.length === 0) return [];
    const sorted = [...slider.items].sort(
      (a, b) => extractTimestamp(a) - extractTimestamp(b)
    );
    return sorted.map((item) => item.newsId).filter(Boolean);
  };

  const collectContainerIds = (container) => {
    if (!container) return [];
    const items = container.items || [];
    const nestedContainers = container.nestedContainers || [];
    const nestedSliders = container.sliders || [];

    const elements = [
      ...items.map((item) => ({ type: "item", data: item, ts: extractTimestamp(item) })),
      ...nestedContainers.map((nested) => ({
        type: "nested",
        data: nested,
        ts: extractTimestamp(nested),
      })),
      ...nestedSliders.map((slider) => ({
        type: "slider",
        data: slider,
        ts: extractTimestamp(slider),
      })),
    ].sort((a, b) => a.ts - b.ts);

    const ids = [];
    elements.forEach((element) => {
      if (element.type === "item") {
        if (element.data?.newsId) ids.push(element.data.newsId);
        return;
      }
      if (element.type === "nested") {
        ids.push(...collectContainerIds(element.data));
        return;
      }
      if (element.type === "slider") {
        ids.push(...collectSliderIds(element.data));
      }
    });
    return ids;
  };

  const orderedNewsIds = useMemo(() => {
    if (!currentPage) return [];
    const ids = [];
    containers.forEach((container) => {
      ids.push(...collectContainerIds(container));
    });
    sliders.forEach((slider) => {
      ids.push(...collectSliderIds(slider));
    });
    return ids.filter(Boolean);
  }, [containers, sliders, currentPage]);

  useEffect(() => {
    if (!orderedNewsIds.length) return;
    enqueueNewsSummaries(orderedNewsIds);
  }, [enqueueNewsSummaries, orderedNewsIds]);

  return (
    <>
      <BrandLoader show={showBrandLoader} fading={brandFading} />
      {/* MobileContext is provided here so every nested PreviewContainer,
          NestedContainer overlay, or slider can read `isMobile` without
          prop-drilling through the entire tree. */}
      <MobileContext.Provider value={isMobile}>
        <ImageLoadProvider canLoad={canLoadImages}>
          <div
            style={{
              height: effectiveHeight,
              minHeight: isMobile ? "auto" : undefined,
              padding: effectivePadding,
              position: "relative",
              // Keep overflow hidden on desktop to clip absolute-positioned lines.
              // On mobile use visible so stacked content isn't clipped.
              overflow: isMobile ? "visible" : "hidden",
              width: "100%",
              maxWidth: "1250px",
              margin: "0 auto",
              // Smooth transition when resizing between breakpoints
              transition: "padding 0.2s ease",
              boxSizing: "border-box",
            }}
          >
        {/* ── Grid of containers ────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${effectiveGridColumns}, 1fr)`,
            gap: `${pageSettings.gap}px`,
            width: "100%",
            marginBottom: `${pageSettings.gap}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {showSkeletons &&
            Array.from({ length: Math.min(initialBatch, skeletonTotal) }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="skeleton-card skeleton">
                <div className="skeleton skeleton-line" style={{ width: "60%" }} />
                <div className="skeleton skeleton-line" style={{ width: "90%" }} />
                <div className="skeleton skeleton-line" style={{ width: "80%" }} />
                <div className="skeleton skeleton-block" />
              </div>
            ))}

          {!showSkeletons &&
            visibleContainers.map((container) => (
              <PreviewContainer
                key={container.id}
                id={container.id}
                catName={pageName}
                // isMobile is forwarded as a prop for components that accept it
                // directly, AND is available via useMobile() for deeper descendants.
                isMobile={isMobile}
              />
            ))}

          {!showSkeletons &&
            remainingCount > 0 &&
            Array.from({ length: remainingCount }).map((_, idx) => (
              <div key={`pending-${idx}`} className="skeleton-card skeleton">
                <div className="skeleton skeleton-line" style={{ width: "55%" }} />
                <div className="skeleton skeleton-line" style={{ width: "85%" }} />
                <div className="skeleton skeleton-line" style={{ width: "70%" }} />
                <div className="skeleton skeleton-block" />
              </div>
            ))}
        </div>

        {/* ── Page-level sliders ────────────────────────────────────────── */}
        {phase < 2 && sliders.length > 0 && (
          <div className="skeleton-card skeleton" style={{ marginBottom: `${pageSettings.gap}px` }}>
            <div className="skeleton skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton skeleton-block" style={{ height: "200px" }} />
          </div>
        )}

        {phase >= 2 &&
          sliders.map((slider) => (
            <div
              key={slider.id}
              style={{
                marginBottom: `${pageSettings.gap}px`,
                position: "relative",
                zIndex: 2,
                // Sliders scroll horizontally on desktop; on mobile we let them
                // scroll naturally within their own container.
                overflowX: isMobile ? "auto" : undefined,
              }}
            >
              <PreviewSlider
                id={slider.id}
                catName={pageName}
                containerId={null}
                isNested={false}
                parentContainerId={null}
                isMobile={isMobile}
              />
            </div>
          ))}

        {/* ── Page-level lines (desktop only) ──────────────────────────── */}
        {/* Lines are absolutely positioned decorative elements designed for the
            fixed-height desktop canvas. They have no meaningful representation
            in a reflowed single-column mobile layout, so we suppress them. */}
        {!isMobile &&
          phase >= 1 &&
          lines.map((line) => {
            const isHorizontal = line.orientation === "horizontal";
            const bg =
              line.lineType === "pink-bold" ? "#e91e63" : "#d0d0d0";
            const width = isHorizontal ? `${line.length}px` : "2px";
            const height = isHorizontal ? "2px" : `${line.length}px`;

            return (
              <div
                key={line.id}
                style={{
                  position: "absolute",
                  left: line.x,
                  top: line.y,
                  width,
                  height,
                  backgroundColor: bg,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            );
          })}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading &&
          !currentPage &&
          containers.length === 0 &&
          sliders.length === 0 &&
          lines.length === 0 && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#999",
                fontSize: "16px",
              }}
            >
              No content available for this page
            </div>
          )}
        </div>
        </ImageLoadProvider>
      </MobileContext.Provider>
    </>
  );
}
