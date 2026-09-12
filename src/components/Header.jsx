import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { LogoModal } from "./LogoModal";
import { getPrimaryPhone, getWhatsAppUrl } from "../data/algeriaWilayasCommunes";
import {
  Phone,
  MessageSquare,
  Globe,
  Lock,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  MapPin
} from "lucide-react";

export function Header({ onOpenAdmin, onOpenBooking }) {
  const { lang, toggleLang, isRtl, t } = useLanguage();
  const { data } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phonesDropdownOpen, setPhonesDropdownOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const settings = data?.settings || {};
  const phoneNumbers = settings.phoneNumbers || [
    { id: "p1", number: "0561147039", labelFr: "Service Client", labelAr: "خدمة الزبائن", isPrimary: true }
  ];
  const primaryPhoneNumber = getPrimaryPhone(settings);
  const primaryPhone = phoneNumbers.find((p) => p && p.isPrimary) || phoneNumbers.find((p) => p && p.number === primaryPhoneNumber) || phoneNumbers[0] || { number: primaryPhoneNumber };
  const whatsappUrl = getWhatsAppUrl(primaryPhoneNumber);

  const navLinks = [
    { href: "#accueil", label: t.nav.home },
    { href: "#produits", label: t.nav.products },
    { href: "#services", label: t.nav.services },
    { href: "#avant-apres", label: t.nav.comparison },
    { href: "#realisations", label: t.nav.gallery },
    { href: "#contact", label: t.nav.contact }
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5 group py-1">
            {/* Interactive Tappable Logo Trigger */}
            <button
              type="button"
              onClick={() => setLogoModalOpen(true)}
              className="relative cursor-pointer focus:outline-none transition-transform active:scale-95"
              title={isRtl ? "اضغط لتكبير الشعار" : "Touchez pour agrandir le logo"}
              aria-label="Agrandir le logo"
            >
              {/* Periodic Radar Pulse Ring */}
              <div className="absolute -inset-1 rounded-full bg-brand-red/50 blur-sm animate-logo-radar pointer-events-none" />
              
              {/* Bigger Logo with Periodic Motion & Shine */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black p-0.5 animate-logo-periodic group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="AutoLedBlida Red Eagle Logo"
                  className="w-full h-full object-cover rounded-full"
                />
                {/* Diagonal Shimmer Light Sweep */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-logo-shine pointer-events-none rounded-full" />
              </div>
            </button>

            {/* Brand Title linking to top */}
            <a href="#accueil" className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white group-hover:text-brand-redLight transition-colors">
                  {isRtl ? "أوتو ليد البليدة" : "AUTO LED BLIDA"}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-red" />
                {isRtl ? settings.cityAr || "أولاد يعيش - البليدة" : settings.city || "Ouled Yaïch, Blida"}
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-zinc-300 hover:text-white hover:text-glow-red transition-all relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-red hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phone Numbers Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setPhonesDropdownOpen(!phonesDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700/60 hover:border-brand-red/60 text-zinc-200 text-sm font-semibold transition-all hover:shadow-glow-red"
                title="Numéros de contact"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Phone className="w-3.5 h-3.5 text-brand-red" />
                <span className="font-mono">{primaryPhone?.number || "0561 14 70 39"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {phonesDropdownOpen && (
                <div
                  className={`absolute mt-2 w-72 rounded-xl bg-brand-surface border border-zinc-700 shadow-card p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isRtl ? "left-0" : "right-0"
                  }`}
                >
                  <div className="px-3 py-2 text-xs font-bold uppercase text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                    <span>{isRtl ? "أرقام ورشة أوتو ليد" : "Nos Numéros de Contact"}</span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      {isRtl ? "توصيل 69 ولاية" : "Livraison 69W"}
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    {phoneNumbers.map((p) => (
                      <a
                        key={p.id || p.number}
                        href={`tel:${p.number}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-sm text-zinc-200 hover:text-white transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-zinc-100 group-hover:text-brand-redLight">
                            {p.number}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {isRtl ? p.labelAr || "خدمة الزبائن" : p.labelFr || "Service Client"}
                          </span>
                        </div>
                        {p.whatsapp && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                            WhatsApp
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Quick Button (Opens Primary Phone WhatsApp) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/30"
              title={isRtl ? `محادثة واتساب مباشرة (${primaryPhoneNumber})` : `Discussion WhatsApp directe (${primaryPhoneNumber})`}
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </a>

            {/* Language Switcher Button (FR <-> AR) */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-brand-red text-zinc-300 hover:text-white text-xs font-bold transition-all"
              title="Changer de langue / تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5 text-brand-red" />
              <span>{lang === "fr" ? "العربية" : "Français"}</span>
            </button>


            {/* Admin Back-Office Lock Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/60 text-zinc-400 hover:text-amber-400 transition-colors"
              title={t.nav.admin}
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-b border-zinc-800 px-5 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-medium text-zinc-200 hover:bg-zinc-800/80 hover:text-brand-redLight transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight text-white font-bold flex items-center justify-center gap-2 shadow-glow-red"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.hero.ctaBooking}</span>
            </button>

            <a
              href={`tel:${primaryPhoneNumber}`}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Phone className="w-4 h-4 text-brand-red" />
              <span>
                {isRtl ? "اتصل بنا :" : "Appeler :"} {primaryPhoneNumber}
              </span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>
                {isRtl ? "واتساب ورشة أوتو ليد" : "WhatsApp Principal"} ({primaryPhoneNumber})
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Animated Logo Lightbox Modal */}
      <LogoModal isOpen={logoModalOpen} onClose={() => setLogoModalOpen(false)} />
    </header>
  );
}