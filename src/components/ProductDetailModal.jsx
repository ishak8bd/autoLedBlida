import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  X,
  ShoppingBag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Wrench,
  Check,
  Maximize2
} from "lucide-react";

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onBuy,
  onBook
}) {
  const { isRtl, t } = useLanguage();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(0);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Gather all images (prefer images array, fallback to single image)
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || "/biled-lens.jpg"];

  const currentImage = images[activeImageIndex] || images[0] || "/biled-lens.jpg";

  const title = isRtl ? product.nameAr || product.nameFr : product.nameFr;
  const desc = isRtl ? product.descriptionAr || product.descriptionFr : product.descriptionFr;
  const badge = isRtl ? product.badgeAr || product.badgeFr : product.badgeFr;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-6 rounded-3xl glass-panel border border-zinc-700 bg-brand-surface shadow-2xl p-5 sm:p-7 text-start max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Image Viewer + Thumbnails */}
          <div className="space-y-3">
            {/* Main Active Picture */}
            <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner group">
              <img
                src={currentImage}
                alt={title}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 flex flex-col gap-1.5 z-10">
                {badge && (
                  <span className="px-2.5 py-1 rounded-full bg-brand-red text-white text-[11px] font-black tracking-wide shadow-glow-red uppercase">
                    {badge}
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-10">
                {product.inStock ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[11px] font-extrabold flex items-center gap-1 backdrop-blur-md">
                    <Check className="w-3 h-3" />
                    {t.products.inStock}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold backdrop-blur-md">
                    {t.products.outOfStock}
                  </span>
                )}
              </div>

              {/* Navigation Arrows (if multiple images) */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-zinc-700 backdrop-blur-sm transition-all cursor-pointer"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-zinc-700 backdrop-blur-sm transition-all cursor-pointer"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Counter pill */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono backdrop-blur-sm">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip (if multiple pictures) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-brand-red ring-2 ring-brand-red/40 scale-105"
                        : "border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600"
                    }`}
                  >
                    <img src={img} alt={`Vignette ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-bold text-brand-red uppercase tracking-wider">
                {product.category}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {title}
              </h3>

              {/* Price Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-baseline justify-between">
                <span className="text-xs text-zinc-400 font-medium">
                  {isRtl ? "السعر الإجمالي :" : "Prix unitaire :"}
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  {product.price ? product.price.toLocaleString() : "Sur devis"}{" "}
                  <span className="text-brand-redLight text-base font-bold">
                    {t.products.currency}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                  {isRtl ? "تفاصيل المنتج والمواصفات :" : "Description & Caractéristiques :"}
                </span>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
                  {desc}
                </p>
              </div>

              {/* Service & Guarantee Badges */}
              <div className="space-y-2 pt-1 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isRtl ? "توصيل سريع متوفر لكافة الـ 69 ولاية" : "Livraison rapide disponible dans les 69 wilayas"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{isRtl ? "منتجات أصلية مجربة في ورشتنا بالبليدة" : "Matériel haute qualité testé dans notre atelier"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand-red shrink-0" />
                  <span>{isRtl ? "إمكانية التركيب والضبط الدقيق في الورشة بأولاد يعيش" : "Possibilité de pose & réglage optique à Ouled Yaïch, Blida"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBuy) onBuy(product);
                }}
                className="py-3 px-4 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-glow-red hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.products.buyBtn || (isRtl ? "شراء / طلب" : "Acheter / Commander")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBook) onBook(product);
                }}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 active:scale-[0.98] cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-brand-red" />
                <span>{t.products.bookBtn || (isRtl ? "حجز موعد" : "Faire un rendez-vous")}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
