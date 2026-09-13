import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { getPrimaryPhone, getWhatsAppUrl } from "../data/algeriaWilayasCommunes";
import {
  ShoppingBag,
  Search,
  MessageSquare,
  Calendar,
  Check,
  Truck,
  Filter,
  Flame,
  Tag,
  Eye,
  Images,
  Sparkles,
  ArrowUpDown,
  Maximize2,
  X
} from "lucide-react";
import { ProductImageLightboxModal } from "./ProductImageLightboxModal";

export function Products({ onSelectProductForBooking, onBuyProduct, onViewProduct }) {
  const { t, isRtl } = useLanguage();
  const { data } = useData();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all"); // 'all' | 'asc' | 'desc' | 'under10k' | '10k-20k' | 'over20k'
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [lightboxProduct, setLightboxProduct] = useState(null);

  const categories = data?.categories || [];
  const products = data?.products || [];
  const settings = data?.settings || {};
  const primaryPhone = getPrimaryPhone(settings);

  // Filter products by category, search, stock, promo, new, and price
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category
        if (selectedCategory !== "all" && p.category !== selectedCategory) {
          return false;
        }

        // Search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameToSearch = (
            (p.nameFr || "") +
            " " +
            (p.nameAr || "") +
            " " +
            (p.descriptionFr || "") +
            " " +
            (p.badgeFr || "")
          ).toLowerCase();
          if (!nameToSearch.includes(query)) return false;
        }

        // Disponibilité (En Stock)
        if (onlyInStock && p.inStock === false) {
          return false;
        }

        // Promotion
        if (onlyPromo) {
          const isPromo = Boolean(
            p.isPromo ||
            (p.oldPrice && p.oldPrice > p.price) ||
            (p.badgeFr && /promo|sold|remise|réduction|best-seller/i.test(p.badgeFr)) ||
            (p.badgeAr && /تخفيض|عرض|خصم|الأكثر طلباً/i.test(p.badgeAr))
          );
          if (!isPromo) return false;
        }

        // Nouveauté
        if (onlyNew) {
          const isNew = Boolean(
            p.isNew ||
            (p.badgeFr && /nouveau|nouv|new|2024|2025|2026/i.test(p.badgeFr)) ||
            (p.nameFr && /2024|2025|2026/i.test(p.nameFr)) ||
            (p.badgeAr && /جديد/i.test(p.badgeAr))
          );
          if (!isNew) return false;
        }

        // Price range filtering
        if (priceFilter === "under10k" && (p.price || 0) >= 10000) return false;
        if (priceFilter === "10k-20k" && ((p.price || 0) < 10000 || (p.price || 0) > 20000)) return false;
        if (priceFilter === "over20k" && (p.price || 0) <= 20000) return false;

        return true;
      })
      .sort((a, b) => {
        if (priceFilter === "asc") return (a.price || 0) - (b.price || 0);
        if (priceFilter === "desc") return (b.price || 0) - (a.price || 0);
        return 0;
      });
  }, [products, selectedCategory, searchQuery, onlyInStock, onlyPromo, onlyNew, priceFilter]);

  // Generate WhatsApp order URL using principal phone number
  const getProductWhatsAppUrl = (product) => {
    const message = isRtl
      ? `سلام عليكم، أود طلب وشراء هذا المنتج من أوتو ليد البليدة:\n- المنتج: ${product.nameAr || product.nameFr}\n- السعر: ${product.price?.toLocaleString()} د.ج\nهل متوفر التوصيل؟ شكراً.`
      : `Bonjour AutoLedBlida, je souhaite commander ce produit:\n- Produit: ${product.nameFr}\n- Prix: ${product.price?.toLocaleString()} DZD\nEst-il disponible en stock / livraison ? Merci.`;

    return getWhatsAppUrl(primaryPhone, message);
  };

  return (
    <section id="produits" className="py-20 bg-zinc-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl text-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" />
              {t.products.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t.products.title}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              {t.products.subtitle}
            </p>
          </div>

          {/* Delivery & Wilaya Notice */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-start">
              <div className="text-xs font-bold text-white uppercase tracking-wide">
                {isRtl ? "التوصيل لكافة الـ 69 ولاية" : "Livraison 69 Wilayas"}
              </div>
              <div className="text-[11px] text-zinc-400">
                {isRtl ? "توصيل سريع حتى باب المنزل أو المكتب" : "Expédition rapide à domicile ou stop-desk"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="glass-panel p-4 rounded-2xl mb-10 space-y-4 border border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-brand-red text-white shadow-glow-red"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {t.products.allCategories}
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-brand-red text-white shadow-glow-red"
                      : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {isRtl ? cat.nameAr : cat.nameFr}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.products.searchPlaceholder}
                className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-colors"
              />
            </div>

          </div>

          {/* Quick Filters Toolbar: Prix, Disponibilité, Promotion, Nouveauté */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            {/* Filter Toggle Buttons: Disponibilité, Promotion, Nouveauté */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5 mr-1 rtl:mr-0 rtl:ml-1">
                <Filter className="w-3.5 h-3.5 text-brand-red" />
                <span>{isRtl ? "فلترة :" : "Filtres :"}</span>
              </span>

              {/* Disponibilité (En Stock) */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyInStock
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm"
                    : "bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
                title={isRtl ? "عرض المتوفر في المخزون فقط" : "Afficher uniquement les produits disponibles"}
              >
                <div className={`w-2 h-2 rounded-full ${onlyInStock ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                <span>{isRtl ? "متوفر في المخزون" : "En Stock"}</span>
              </button>

              {/* Promotion */}
              <button
                type="button"
                onClick={() => setOnlyPromo(!onlyPromo)}
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyPromo
                    ? "bg-brand-red/25 border-brand-red text-rose-300 shadow-glow-red"
                    : "bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
                title={isRtl ? "عروض وتخفيضات خاصة" : "Afficher les articles en promotion"}
              >
                <Flame className={`w-3.5 h-3.5 ${onlyPromo ? "text-brand-redLight fill-current" : "text-zinc-500"}`} />
                <span>{isRtl ? "تخفيضات" : "Promotions"}</span>
              </button>

              {/* Nouveauté */}
              <button
                type="button"
                onClick={() => setOnlyNew(!onlyNew)}
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyNew
                    ? "bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-sm"
                    : "bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
                title={isRtl ? "أحدث الموديلات والمنتجات" : "Afficher les nouveautés"}
              >
                <Sparkles className={`w-3.5 h-3.5 ${onlyNew ? "text-amber-400" : "text-zinc-500"}`} />
                <span>{isRtl ? "وصل حديثاً" : "Nouveautés"}</span>
              </button>

              {/* Clear active quick filters */}
              {(onlyInStock || onlyPromo || onlyNew || priceFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setOnlyInStock(false);
                    setOnlyPromo(false);
                    setOnlyNew(false);
                    setPriceFilter("all");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title={isRtl ? "إلغاء الفلاتر" : "Réinitialiser les filtres"}
                >
                  <X className="w-3 h-3" />
                  <span>{isRtl ? "إعادة ضبط" : "Effacer"}</span>
                </button>
              )}
            </div>

            {/* Prix Selector (Sort / Range) */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <label htmlFor="priceFilterSelect" className="text-zinc-400 font-semibold flex items-center gap-1.5 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-red" />
                <span>{isRtl ? "السعر :" : "Prix :"}</span>
              </label>

              <select
                id="priceFilterSelect"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-brand-red font-semibold cursor-pointer w-full md:w-auto"
              >
                <option value="all">{isRtl ? "جميع الأسعار (تلقائي)" : "Tous les prix (Par défaut)"}</option>
                <option value="asc">{isRtl ? "السعر: من الأقل إلى الأعلى (↗)" : "Prix croissant (↗)"}</option>
                <option value="desc">{isRtl ? "السعر: من الأعلى إلى الأقل (↘)" : "Prix décroissant (↘)"}</option>
                <option value="under10k">{isRtl ? "أقل من 10,000 د.ج" : "Moins de 10 000 DZD"}</option>
                <option value="10k-20k">{isRtl ? "10,000 إلى 20,000 د.ج" : "10 000 à 20 000 DZD"}</option>
                <option value="over20k">{isRtl ? "أكثر من 20,000 د.ج" : "Plus de 20 000 DZD"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid: 2 Products in Each Line */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-zinc-800">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-base font-semibold">{t.products.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6">
            {filteredProducts.map((product) => {
              const badge = isRtl ? product.badgeAr || product.badgeFr : product.badgeFr;
              const title = isRtl ? product.nameAr || product.nameFr : product.nameFr;
              const desc = isRtl ? product.descriptionAr || product.descriptionFr : product.descriptionFr;
              const imageCount = Array.isArray(product.images) ? product.images.length : 1;

              return (
                <div
                  key={product.id}
                  onClick={() => onViewProduct && onViewProduct(product)}
                  className="rounded-2xl sm:rounded-3xl glass-panel border border-zinc-800 hover:border-brand-red/50 hover:shadow-glow-red transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-square sm:aspect-[4/3] bg-zinc-950 overflow-hidden">
                    <img
                      src={product.image || "/bmw-headlights.png"}
                      alt={title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Hover Visual Preview Hint */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <div className="px-3 py-1.5 rounded-full bg-black/75 border border-zinc-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Eye className="w-3.5 h-3.5 text-brand-red" />
                        <span>{isRtl ? "عرض التفاصيل" : "Aperçu"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxProduct(product);
                        }}
                        className="p-1.5 rounded-full bg-black/75 hover:bg-brand-red border border-zinc-600 hover:border-brand-red text-white transition-all shadow-lg active:scale-90"
                        title={isRtl ? "تكبير الصورة بالكامل" : "Agrandir l'image au complet"}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 rtl:right-auto rtl:left-2 rtl:sm:left-3 z-10">
                      {product.inStock ? (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-[11px] font-extrabold tracking-wide backdrop-blur-md flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">{t.products.inStock}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[10px] sm:text-[11px] font-extrabold tracking-wide backdrop-blur-md">
                          <span className="hidden xs:inline">{t.products.outOfStock}</span>
                        </span>
                      )}
                    </div>

                    {/* Multi-Images Indicator */}
                    {imageCount > 1 && (
                      <div className="absolute bottom-2 left-2 rtl:left-auto rtl:right-2 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-black/75 border border-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center gap-1 backdrop-blur-sm">
                          <Images className="w-3 h-3 text-brand-red" />
                          <span>{imageCount} photos</span>
                        </span>
                      </div>
                    )}

                    {/* Promotional / Novelty Badges */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 rtl:left-auto rtl:right-2 rtl:sm:right-3 z-10 flex flex-col gap-1 items-start">
                      {badge && (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-brand-red text-white text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-glow-red">
                          {badge}
                        </span>
                      )}
                      {(product.isPromo || (product.oldPrice && Number(product.oldPrice) > Number(product.price))) && !badge?.toLowerCase().includes("promo") && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span>Promo</span>
                        </span>
                      )}
                      {product.isNew && !badge?.toLowerCase().includes("nouv") && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          <span>{isRtl ? "جديد" : "Nouveau"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content (Compact & Sleek) */}
                  <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between text-start space-y-3">
                    <div className="space-y-1 sm:space-y-1.5">
                      <h3 className="text-xs sm:text-base font-bold text-white group-hover:text-brand-redLight transition-colors line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-2 sm:pt-3 border-t border-zinc-800/80 space-y-2.5">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                          {isRtl ? "السعر :" : "Prix :"}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          {product.oldPrice && Number(product.oldPrice) > Number(product.price) && (
                            <span className="text-[10px] sm:text-xs text-zinc-500 line-through font-mono">
                              {Number(product.oldPrice).toLocaleString()}
                            </span>
                          )}
                          <div className="text-sm sm:text-lg font-black text-white font-mono">
                            {product.price ? product.price.toLocaleString() : "Sur devis"}{" "}
                            <span className="text-brand-redLight text-xs sm:text-sm font-bold">
                              {t.products.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Two Action Buttons: Acheter / Commander + Faire Rendez-vous */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBuyProduct) onBuyProduct(product);
                          }}
                          className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-glow-red hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">{t.products.buyBtn || (isRtl ? "شراء / طلب" : "Acheter")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectProductForBooking) onSelectProductForBooking(product);
                          }}
                          className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 border border-zinc-700 hover:border-zinc-500 active:scale-[0.98] cursor-pointer"
                        >
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-red shrink-0" />
                          <span className="truncate">{t.products.bookBtn || (isRtl ? "حجز موعد" : "Rendez-vous")}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Product Image Lightbox Modal */}
      {lightboxProduct && (
        <ProductImageLightboxModal
          isOpen={Boolean(lightboxProduct)}
          onClose={() => setLightboxProduct(null)}
          images={
            Array.isArray(lightboxProduct.images) && lightboxProduct.images.length > 0
              ? lightboxProduct.images
              : [lightboxProduct.image || "/biled-lens.jpg"]
          }
          title={isRtl ? lightboxProduct.nameAr || lightboxProduct.nameFr : lightboxProduct.nameFr}
        />
      )}
    </section>
  );
}