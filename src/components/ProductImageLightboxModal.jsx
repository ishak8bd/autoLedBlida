import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Loader2
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function ProductImageLightboxModal({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  title = ""
}) {
  const { isRtl } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Normalize images array to ensure valid non-empty URLs
  const rawImages = Array.isArray(images) ? images : [images];
  const safeImages = rawImages
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean);
  const displayImages = safeImages.length > 0 ? safeImages : ["/biled-lens.jpg"];

  // Sync index when opened or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, displayImages.length - 1)));
      setZoomLevel(1);
      setImgLoading(true);
      setImgError(false);
    }
  }, [isOpen, initialIndex, displayImages.length]);

  const safeIndex = Math.max(0, Math.min(currentIndex, displayImages.length - 1));
  const currentImage = displayImages[safeIndex] || displayImages[0];

  // Reset loading & error whenever active image changes
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [currentImage]);

  const nextImage = useCallback(() => {
    if (displayImages.length <= 1) return;
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const prevImage = useCallback(() => {
    if (displayImages.length <= 1) return;
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev > 1 ? 1 : 2));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        isRtl ? prevImage() : nextImage();
      } else if (e.key === "ArrowLeft") {
        isRtl ? nextImage() : prevImage();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, nextImage, prevImage, isRtl]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl select-none"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Visionneuse d'images"}
    >
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="p-2 rounded-xl bg-brand-red/20 border border-brand-red/40 text-brand-red shrink-0">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {title}
            </h3>
            {displayImages.length > 1 && (
              <p className="text-xs text-zinc-400 font-mono">
                {safeIndex + 1} / {displayImages.length}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1 text-zinc-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-brand-red transition-all cursor-pointer"
                title="Taille réelle (100%)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-brand-red text-zinc-300 hover:text-white hover:bg-brand-red/20 transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      {/* Main Image Stage - 100% Uncropped & Wide */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation Arrow Left */}
        {displayImages.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-brand-red border border-zinc-700 hover:border-brand-red text-white transition-all shadow-2xl backdrop-blur-md cursor-pointer active:scale-90"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Active Fullscreen Image Container */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in"
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
          title={zoomLevel > 1 ? (isRtl ? "انقر للتصغير" : "Cliquer pour dézoomer") : (isRtl ? "انقر للتكبير" : "Cliquer pour zoomer")}
        >
          {imgLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none text-zinc-400 z-10">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
              <span className="text-xs font-mono">{isRtl ? "جاري التحميل..." : "Chargement de l'image..."}</span>
            </div>
          )}

          <img
            src={imgError ? "/biled-lens.jpg" : currentImage}
            alt={title}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false);
              setImgError(true);
            }}
            className={`max-w-[95vw] max-h-[78vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] select-none pointer-events-auto transition-opacity duration-200 ${
              imgLoading ? "opacity-0" : "opacity-100"
            }`}
            draggable={false}
          />
        </div>

        {/* Navigation Arrow Right */}
        {displayImages.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-brand-red border border-zinc-700 hover:border-brand-red text-white transition-all shadow-2xl backdrop-blur-md cursor-pointer active:scale-90"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Thumbnail Strip & Zoom Hint */}
      <footer className="w-full z-50 py-3 px-4 sm:px-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col items-center gap-2">
        {displayImages.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setCurrentIndex(idx);
                }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  safeIndex === idx
                    ? "border-brand-red ring-2 ring-brand-red/50 scale-105 opacity-100"
                    : "border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-600"
                }`}
              >
                <img
                  src={img}
                  alt={`Vignette ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/biled-lens.jpg";
                  }}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400 font-medium">
            {isRtl ? "انقر على الصورة للتكبير / التصغير" : "Cliquez sur l'image pour zoomer / dézoomer"}
          </div>
        )}
      </footer>
    </div>,
    document.body
  );
}
