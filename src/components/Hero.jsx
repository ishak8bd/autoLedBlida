import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Phone,
  Flame,
  Sun,
  ShieldCheck,
  Truck,
  Eye
} from "lucide-react";

export function Hero({ onOpenBooking }) {
  const { isRtl, t } = useLanguage();
  const { data } = useData();
  const [lightsOn, setLightsOn] = useState(true);

  const settings = data?.settings || {};
  const phoneNumbers = settings.phoneNumbers || [];
  const primaryPhone = phoneNumbers.find((p) => p.isPrimary) || phoneNumbers[0] || { number: "0561147039" };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="accueil" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-6 pb-20">
      {/* Dynamic Background Lighting Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep ambient red aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-red/15 rounded-full blur-[140px]" />
        {/* Secondary cold xenon glow */}
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-sky-500/10 rounded-full blur-[100px]" />
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e08_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e08_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left / Text Content Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-start space-y-6">
            
            {/* Top Brand Badges */}
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/15 border border-brand-red/40 text-brand-redLight text-xs font-bold tracking-wide uppercase shadow-glow-red">
                <Flame className="w-3.5 h-3.5" />
                {t.hero.badge}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                {isRtl ? "توصيل 69 ولاية" : "Livraison 69 Wilayas"}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              {t.hero.titleMain}{" "}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-brand-redLight to-rose-400">
                {t.hero.titleHighlight}
              </span>
            </h1>

            {/* Subtitle & Value Proposition */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed font-normal">
              {t.hero.subtitle}
            </p>

            {/* Call To Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              {/* Primary Booking Button */}
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white text-base font-bold shadow-glow-red hover:shadow-glow-red-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>{t.hero.ctaBooking}</span>
                <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* View Catalog Button */}
              <a
                href="#produits"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-base font-bold transition-all flex items-center justify-center gap-2.5"
              >
                <ShoppingBag className="w-5 h-5 text-brand-red" />
                <span>{t.hero.ctaProducts}</span>
              </a>

              {/* Quick Call Button */}
              <a
                href={`tel:${primaryPhone.number}`}
                className="w-full sm:w-auto px-4 py-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="font-mono">{primaryPhone.number}</span>
              </a>
            </div>

            {/* Proof Stats strip */}
            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white">95.1K+</span>
                <span className="text-xs text-zinc-400 font-medium">{t.hero.stats.followers}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-brand-redLight">370K+</span>
                <span className="text-xs text-zinc-400 font-medium">{t.hero.stats.likes}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">69</span>
                <span className="text-xs text-zinc-400 font-medium">{isRtl ? "ولاية توصيل" : "Wilayas livrées"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-amber-400">100%</span>
                <span className="text-xs text-zinc-400 font-medium">{isRtl ? "جودة وأمان" : "Qualité garantie"}</span>
              </div>
            </div>

          </div>

          {/* Right / Visual Showcase Column */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            
            {/* Interactive Vehicle Showcase Card */}
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden glass-panel border border-zinc-700/80 shadow-card p-3 group">
              
              {/* Image Container with Headlight Glow Simulation */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src="/bmw-headlights.png"
                  alt="AutoLedBlida BMW Angel Eyes Headlight Upgrade"
                  className={`w-full h-full object-cover object-center transition-all duration-700 ${
                    lightsOn ? "brightness-110 contrast-110" : "brightness-60 contrast-90 filter grayscale-[40%]"
                  }`}
                />

                {/* Simulated Xenon/Bi-LED Light Beams when lightsOn is TRUE */}
                {lightsOn && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Angel Eye rings highlight */}
                    <div className="absolute top-[48%] left-[24%] w-16 h-16 rounded-full bg-cyan-300/40 blur-md animate-pulse" />
                    <div className="absolute top-[46%] left-[34%] w-14 h-14 rounded-full bg-cyan-300/40 blur-md animate-pulse" />
                    
                    <div className="absolute top-[46%] right-[34%] w-14 h-14 rounded-full bg-cyan-300/40 blur-md animate-pulse" />
                    <div className="absolute top-[48%] right-[24%] w-16 h-16 rounded-full bg-cyan-300/40 blur-md animate-pulse" />

                    {/* Laser light projection onto the road */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-cyan-400/20 via-sky-300/10 to-transparent blur-lg" />
                  </div>
                )}

                {/* Top Floating Badge */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-700 text-xs font-bold text-white flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${lightsOn ? "bg-cyan-400 animate-ping" : "bg-zinc-500"}`} />
                  <span>{lightsOn ? (isRtl ? "أضواء بي ليد نشطة" : "Bi-LED 6000K Actif") : (isRtl ? "الأضواء مطفأة" : "Phares éteints")}</span>
                </div>

                {/* Light toggle overlay control */}
                <button
                  onClick={() => setLightsOn(!lightsOn)}
                  className="absolute bottom-3.5 right-3.5 px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-brand-red/60 text-white hover:text-brand-redLight text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all hover:scale-105"
                  title="Activer / Désactiver la simulation d'éclairage"
                >
                  <Sun className={`w-3.5 h-3.5 ${lightsOn ? "text-amber-400" : "text-zinc-400"}`} />
                  <span>{lightsOn ? t.hero.toggleLightsOn : t.hero.toggleLightsOff}</span>
                </button>
              </div>

              {/* Bottom Card Caption */}
              <div className="p-3 text-start flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>BMW F30 Retrofit Bi-LED AOZOOM</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-red/30 text-brand-redLight font-extrabold uppercase">
                      Pro
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isRtl ? "تم في ورشة أوتو ليد البليدة - أولاد يعيش" : "Réalisé à l'atelier AutoLedBlida - Ouled Yaïch"}
                  </p>
                </div>
                <a
                  href="#realisations"
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
                  title="Voir la galerie"
                >
                  <Eye className="w-4 h-4" />
                </a>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}