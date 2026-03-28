import { useEffect, useState } from "react";

export default function useProgressiveLoading({
  totalItems = 0,
  initialBatch = 3,
  batchSize = 4,
  enable = true,
}) {
  const [showBrandLoader, setShowBrandLoader] = useState(true);
  const [brandFading, setBrandFading] = useState(false);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [phase, setPhase] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!enable) {
      setShowBrandLoader(false);
      setBrandFading(false);
      setHasBootstrapped(true);
      return;
    }

    if (hasBootstrapped) return;

    const hide = () => {
      setBrandFading(false);
      setShowBrandLoader(false);
      setHasBootstrapped(true);
    };

    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      const raf = window.requestAnimationFrame(hide);
      const fallback = window.setTimeout(hide, 300);
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(fallback);
      };
    }

    hide();
  }, [enable, hasBootstrapped]);

  useEffect(() => {
    if (!enable) {
      setShowBrandLoader(false);
      setBrandFading(false);
      setPhase(3);
      setVisibleCount(totalItems);
      return;
    }

    if (showBrandLoader) return;

    const nextInitial = Math.min(initialBatch, totalItems);
    setVisibleCount(nextInitial);
    setPhase(0);

    const textTimer = setTimeout(() => setPhase(1), 120);
    const containerTimer = setTimeout(() => setPhase(2), 450);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(containerTimer);
    };
  }, [enable, initialBatch, showBrandLoader, totalItems]);

  useEffect(() => {
    if (showBrandLoader || phase < 2) return;
    if (visibleCount >= totalItems) return;

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      setVisibleCount((prev) => Math.min(prev + batchSize, totalItems));
      if (window.requestIdleCallback) {
        window.requestIdleCallback(schedule, { timeout: 300 });
      } else {
        setTimeout(schedule, 60);
      }
    };

    schedule();

    return () => {
      cancelled = true;
    };
  }, [batchSize, phase, showBrandLoader, totalItems, visibleCount]);

  useEffect(() => {
    if (showBrandLoader) return;
    if (phase < 2) return;
    if (visibleCount < totalItems) return;
    const timer = setTimeout(() => setPhase(3), 200);
    return () => clearTimeout(timer);
  }, [phase, showBrandLoader, totalItems, visibleCount]);

  const showSkeletons = !showBrandLoader && phase === 0;
  const canLoadImages = !showBrandLoader && phase >= 3;

  return {
    showBrandLoader,
    brandFading,
    phase,
    visibleCount,
    showSkeletons,
    canLoadImages,
  };
}
