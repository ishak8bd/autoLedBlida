import React, { useState } from "react";
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

export function Home({ onOpenAdmin }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

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

        {/* 4 Service Cards matching shop signage */}
        <ServiceStrip onOpenBooking={handleOpenBookingDirect} />

        {/* Interactive Before/After Headlight Comparison */}
        <BeforeAfter />

        {/* Dynamic Product Catalog with 69 Wilayas & WhatsApp Ordering */}
        <Products
          onBuyProduct={handleOpenOrder}
          onSelectProductForBooking={handleOpenBookingWithProduct}
          onViewProduct={handleOpenView}
        />

        {/* Portfolio & TikTok Showcase */}
        <Gallery onOpenBooking={handleOpenBookingDirect} />
      </main>

      {/* Footer with Google Maps & All Phone Lines */}
      <Footer onOpenAdmin={onOpenAdmin} />

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