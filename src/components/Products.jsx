import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { ALGERIA_WILAYAS } from "../i18n/translations";
import {
  ShoppingBag,
  Search,
  MessageSquare,
  Calendar,
  Check,
  Truck,
  Filter,
  Flame,
  Tag
} from "lucide-react";

export function Products({ onSelectProductForBooking, onBuyProduct }) {
  const { t, isRtl } = useLanguage();
  const { data } = useData();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");

  const categories = data?.categories || [];
  const products = data?.products || [];
  const settings = data?.settings || {};
  const whatsappNumber = (settings.whatsappMain || "0561147039").replace(/\s+/g, "");

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    const nameToSearch = (p.nameFr + " " + p.nameAr + " " + (p.descriptionFr || "")).toLowerCase();
    const matchesSearch = !searchQuery || nameToSearch.includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Generate WhatsApp order URL
  const getWhatsAppUrl = (product) => {
    const wilayaText = selectedWilaya ? ` (Wilaya: ${selectedWilaya})` : "";
    const message = isRtl
      ? `سلام عليكم، أود طلب وشراء هذا المنتج من أوتو ليد البليدة:\n- المنتج: ${product.nameAr || product.nameFr}\n- السعر: ${product.price?.toLocaleString()} د.ج${wilayaText}\nهل متوفر التوصيل؟ شكراً.`
      : `Bonjour AutoLedBlida, je souhaite commander ce produit:\n- Produit: ${product.nameFr}\n- Prix: ${product.price?.toLocaleString()} DZD${wilayaText}\nEst-il disponible en stock / livraison ? Merci.`;

    const cleanNum = whatsappNumber.replace(/^0/, "");
    return `https://wa.me/213${cleanNum}?text=${encodeURIComponent(message)}`;
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

          {/* Wilaya Selection Quick Assistant */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-brand-red" />
              {isRtl ? "حدد ولايتك للحصول على طلبية فورية عبر الواتساب:" : "Sélectionnez votre wilaya pour pré-remplir votre commande WhatsApp :"}
            </span>

            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-brand-red font-medium"
            >
              <option value="">{t.products.wilayaSelectPlaceholder}</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-zinc-800">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-base font-semibold">{t.products.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const badge = isRtl ? product.badgeAr || product.badgeFr : product.badgeFr;
              const title = isRtl ? product.nameAr || product.nameFr : product.nameFr;
              const desc = isRtl ? product.descriptionAr || product.descriptionFr : product.descriptionFr;

              return (
                <div
                  key={product.id}
                  className="rounded-3xl glass-panel border border-zinc-800 hover:border-brand-red/50 hover:shadow-glow-red transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                    <img
                      src={product.image || "/bmw-headlights.png"}
                      alt={title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
                      {product.inStock ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[11px] font-extrabold tracking-wide backdrop-blur-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t.products.inStock}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold tracking-wide backdrop-blur-md">
                          {t.products.outOfStock}
                        </span>
                      )}
                    </div>

                    {/* Promotional Badge (e.g. Best-Seller) */}
                    {badge && (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                        <span className="px-2.5 py-1 rounded-full bg-brand-red text-white text-[11px] font-black tracking-wider uppercase shadow-glow-red">
                          {badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between text-start space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-redLight transition-colors line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-zinc-400 font-medium">
                          {isRtl ? "السعر الإفرادي :" : "Prix unitaire :"}
                        </span>
                        <div className="text-xl font-black text-white">
                          {product.price ? product.price.toLocaleString() : "Sur devis"}{" "}
                          <span className="text-brand-redLight text-sm font-bold">
                            {t.products.currency}
                          </span>
                        </div>
                      </div>

                      {/* Two Action Buttons: Acheter / Commander + Faire Rendez-vous */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onBuyProduct && onBuyProduct(product)}
                          className="px-3 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-glow-red hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t.products.buyBtn || (isRtl ? "شراء / طلب" : "Acheter / Commander")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectProductForBooking && onSelectProductForBooking(product)}
                          className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700 hover:border-zinc-500 active:scale-[0.98] cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-brand-red" />
                          <span>{t.products.bookBtn || (isRtl ? "حجز موعد" : "Faire rendez-vous")}</span>
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
    </section>
  );
}