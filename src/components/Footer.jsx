import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { LogoModal } from "./LogoModal";
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  MessageSquare,
  Lock,
  Copy,
  Check,
  Truck
} from "lucide-react";

export function Footer({ onOpenAdmin }) {
  const { t, isRtl } = useLanguage();
  const { data } = useData();
  const [copiedId, setCopiedId] = useState(null);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const settings = data?.settings || {};
  const phoneNumbers = settings.phoneNumbers || [];
  const mapsUrl = settings.googleMapsUrl || "https://maps.app.goo.gl/H6D3GoJHLaYGHUMm8?g_st=ic";

  const handleCopy = (num, id) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <footer id="contact" className="relative bg-zinc-950 border-t border-zinc-800 pt-16 pb-24 sm:pb-16 text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/80">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 group">
              <button
                type="button"
                onClick={() => setLogoModalOpen(true)}
                className="relative flex-shrink-0 cursor-pointer focus:outline-none transition-transform active:scale-95"
                title={isRtl ? "اضغط لتكبير الشعار" : "Touchez pour agrandir le logo"}
                aria-label="Agrandir le logo"
              >
                <div className="absolute -inset-1 rounded-full bg-brand-red/40 blur-sm animate-logo-radar pointer-events-none" />
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black p-0.5 animate-logo-periodic group-hover:scale-105 transition-transform duration-300">
                  <img src="/logo.png" alt="Logo AutoLedBlida" className="w-full h-full object-cover rounded-full" />
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-logo-shine pointer-events-none rounded-full" />
                </div>
              </button>
              <div>
                <span className="font-extrabold text-xl text-white">
                  {isRtl ? "أوتو ليد البليدة" : "AUTO LED BLIDA"}
                </span>
                <div className="text-xs text-brand-redLight font-semibold">
                  {isRtl ? settings.taglineAr : settings.taglineFr}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {isRtl
                ? "متجر وورشة متخصصة في إنارة السيارات، تركيب وتعديل عدسات البي ليد، لمبات الليد، والزينون بأعلى دقة في أولاد يعيش - ولاية البليدة."
                : "Spécialiste de référence en éclairage automobile, projecteurs Bi-LED retrofit, kits xénon et ampoules LED haute puissance à Ouled Yaïch, Blida."}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Truck className="w-4 h-4" />
              <span>{isRtl ? "توصيل سريع لكافة الـ 69 ولاية" : "Livraison rapide dans les 69 wilayas"}</span>
            </div>
          </div>

          {/* Column 2: All Phone Numbers */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-red" />
              <span>{t.contact.phonesTitle}</span>
            </h4>

            <div className="space-y-2.5">
              {phoneNumbers.map((p) => (
                <div
                  key={p.id || p.number}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 text-xs hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-white text-sm">
                      {p.number}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {isRtl ? p.labelAr || "خدمة الزبائن" : p.labelFr || "Service Client"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${p.number}`}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                      title={t.contact.directCall}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    {p.whatsapp && (
                      <a
                        href={`https://wa.me/213${p.number.replace(/\s+/g, "").replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white"
                        title={t.contact.sendWhatsApp}
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      </a>
                    )}

                    <button
                      onClick={() => handleCopy(p.number, p.id || p.number)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                      title={t.contact.copyNumber}
                    >
                      {copiedId === (p.id || p.number) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Location & Google Maps */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-red" />
              <span>{t.contact.addressTitle}</span>
            </h4>

            <p className="text-xs sm:text-sm text-zinc-300">
              {isRtl
                ? settings.addressAr || "الطريق الرئيسي، أولاد يعيش، ولاية البليدة، الجزائر"
                : settings.address || "Route Principale, Ouled Yaïch, Blida, Algérie"}
            </p>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-brand-red text-white text-xs font-bold transition-all hover:shadow-glow-red"
            >
              <MapPin className="w-4 h-4 text-brand-red" />
              <span>{t.contact.openGoogleMaps}</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            {/* Micro map preview banner */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
              {isRtl
                ? "📍 المعلم: بالقرب من الطريق السريع أولاد يعيش، سهولة الوصول والموقف متوفر."
                : "📍 Repère : Proximité axe Ouled Yaïch, accès facile et parking devant l'atelier."}
            </div>
          </div>

          {/* Column 4: Hours & Socials */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-red" />
              <span>{t.contact.hoursTitle}</span>
            </h4>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              {isRtl ? settings.openingHoursAr : settings.openingHoursFr}
            </p>

            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                {t.footer.socialNetworks}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.tiktok.com/@auto.led.blida"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white hover:text-brand-red transition-colors"
                >
                  TikTok (95K)
                </a>
                <a
                  href="https://www.instagram.com/autoledblida"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white hover:text-pink-400 transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white hover:text-blue-400 transition-colors"
                >
                  Facebook
                </a>
              </div>
            </div>

            {/* Espace Pro Admin Shortcut */}
            <div className="pt-3">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.nav.admin} (PIN)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} AutoLedBlida. {t.footer.rights}
          </div>
          <div className="flex items-center gap-4">
            <span>{isRtl ? "أولاد يعيش - ولاية البليدة" : "Ouled Yaïch - Blida, Algérie"}</span>
            <span>•</span>
            <span className="text-emerald-500">{isRtl ? "توصيل 69 ولاية" : "Livraison 69 Wilayas"}</span>
          </div>
        </div>

      </div>

      {/* Animated Logo Lightbox Modal */}
      <LogoModal isOpen={logoModalOpen} onClose={() => setLogoModalOpen(false)} />
    </footer>
  );
}