import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { HolidayBanner } from "../components/HolidayBanner";
import { Hero } from "../components/Hero";
import { ServiceStrip } from "../components/ServiceStrip";
import { BeforeAfter } from "../components/BeforeAfter";
import { Products } from "../components/Products";
import { Gallery } from "../components/Gallery";
import { Footer } from "../components/Footer";
import { MobileBar } from "../components/MobileBar";
import { BookingModal } from "../components/BookingModal";
import { OrderModal } from "../components/OrderModal";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { useLanguage } from "../context/LanguageContext";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function Home({ onOpenAdmin }) {
  const { isRtl } = useLanguage();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

  const [orderDraft, setOrderDraft] = useState(null);

  useEffect(() => {
    const updateDraft = () => {
      try {
        const raw = localStorage.getItem("autoled_order_draft");
        if (raw) {
          setOrderDraft(JSON.parse(raw));
        } else {
          setOrderDraft(null);
        }
      } catch {
        setOrderDraft(null);
      }
    };

    updateDraft();
    window.addEventListener("orderDraftUpdated", updateDraft);
    window.addEventListener("storage", updateDraft);
    return () => {
      window.removeEventListener("orderDraftUpdated", updateDraft);
      window.removeEventListener("storage", updateDraft);
    };
  }, []);

  const handleOpenBookingWithProduct = (product) => {
    setSelectedProduct(product);
    setBookingOpen(true);
  };

  const handleOpenBookingDirect = () => {
    setSelectedProduct(null);
    setBookingOpen(true);
  };

  const handleOpenOrder = (product) => {
    setOrderProduct(product);
    setOrderOpen(true);
  };

  const handleOpenView = (product) => {
    setViewProduct(product);
    setViewOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col">
      {/* Top Announcement Banner (controllable via admin) */}
      <HolidayBanner />

      {/* Main Header with Logo & Navigation */}
      <Header
        onOpenAdmin={onOpenAdmin}
        onOpenBooking={handleOpenBookingDirect}
      />

      {/* Hero Section with Interactive Headlight Beam Toggle */}
      <main className="flex-1">
        <Hero onOpenBooking={handleOpenBookingDirect} />

        {/* Dynamic Product Catalog with 69 Wilayas & WhatsApp Ordering (Boutique & Pièces) */}
        <Products
          onBuyProduct={handleOpenOrder}
          onSelectProductForBooking={handleOpenBookingWithProduct}
          onViewProduct={handleOpenView}
        />

        {/* 4 Service Cards matching shop signage (Prestations & Expertise) */}
        <ServiceStrip onOpenBooking={handleOpenBookingDirect} />

        {/* Interactive Before/After Headlight Comparison */}
        <BeforeAfter />

        {/* Portfolio & TikTok Showcase */}
        <Gallery onOpenBooking={handleOpenBookingDirect} />
      </main>

      {/* Footer with Google Maps & All Phone Lines */}
      <Footer onOpenAdmin={onOpenAdmin} />

      {/* Floating Order Draft Bar when user has items in progress */}
      {orderDraft && orderDraft.items?.length > 0 && !orderOpen && (
        <aside
          aria-label={isRtl ? "طلبية قيد الإنشاء" : "Commande en cours"}
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-brand-red/60 shadow-2xl shadow-brand-red/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-red text-white flex items-center justify-center font-bold relative shrink-0 shadow-sm">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black shadow">
                  {orderDraft.items.reduce((s, it) => s + (it.quantity || 1), 0)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {isRtl ? "طلبية قيد الإنشاء" : "Commande en cours"} ({orderDraft.items.length} {orderDraft.items.length > 1 ? (isRtl ? "منتجات" : "produits") : (isRtl ? "منتج" : "produit")})
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span>{orderDraft.items.reduce((s, it) => s + (Number(it.price) || 0) * (it.quantity || 1), 0).toLocaleString()} DZD</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    • {isRtl ? "توصيل موحد" : "livraison unique"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleOpenOrder(null)}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>{isRtl ? "إتمام الطلب" : "Finaliser"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </aside>
      )}

      {/* Sticky Mobile Quick Call & WhatsApp Action Bar */}
      <MobileBar onOpenBooking={handleOpenBookingDirect} />

      {/* Appointment Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialProduct={selectedProduct}
      />

      {/* Product Purchase Order Modal */}
      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        product={orderProduct}
      />

      {/* High-Resolution Product Detail & Multi-Image Gallery Modal */}
      <ProductDetailModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        product={viewProduct}
        onBuy={handleOpenOrder}
        onBook={handleOpenBookingWithProduct}
      />
    </div>
  );
}