import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Sparkles, Shield, Zap, SlidersHorizontal } from "lucide-react";

export function BeforeAfter() {
  const { t, isRtl } = useLanguage();
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <section id="avant-apres" className="py-20 relative overflow-hidden bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {t.comparison.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t.comparison.title}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            {t.comparison.subtitle}
          </p>
        </div>

        {/* Interactive Comparison Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden select-none border-2 border-zinc-700/80 shadow-2xl bg-black">
            
            {/* Background 1: AFTER (Bi-LED Xenon White Crisp Beam) */}
            <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src="/bmw-headlights.png"
                alt="After: Bi-LED Projector Retrofit"
                className="w-full h-full object-cover brightness-110 contrast-125"
              />
              {/* Crisp 6000K beam simulation */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/25 via-sky-300/10 to-transparent mix-blend-screen pointer-events-none" />
              <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-extrabold text-xs tracking-wide shadow-glow-blue backdrop-blur-md">
                {t.comparison.afterLabel}
              </div>
            </div>

            {/* Foreground 2: BEFORE (Halogen Yellow Dim Beam) - Clipped by Slider */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{
                clipPath: isRtl
                  ? `polygon(0% 0%, ${100 - sliderPosition}% 0%, ${100 - sliderPosition}% 100%, 0% 100%)`
                  : `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
              }}
            >
              <div className="absolute inset-0 w-full h-full bg-zinc-950 flex items-center justify-center">
                <img
                  src="/bmw-headlights.png"
                  alt="Before: Stock Halogen Dim Lights"
                  className="w-full h-full object-cover filter sepia-[65%] brightness-75 contrast-90"
                />
                {/* Yellowish dim halogen fog */}
                <div className="absolute inset-0 bg-amber-900/35 mix-blend-multiply pointer-events-none" />
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-xs backdrop-blur-md">
                  {t.comparison.beforeLabel}
                </div>
              </div>
            </div>

            {/* Vertical Divider Line with handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: isRtl ? `${100 - sliderPosition}%` : `${sliderPosition}%`,
                transform: "translateX(-50%)"
              }}
            >
              <div className="w-10 h-10 rounded-full bg-brand-red border-2 border-white shadow-glow-red flex items-center justify-center text-white cursor-ew-resize">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
            </div>

            {/* Transparent Range Input Slider over the whole canvas */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0"
              aria-label="Contrôle du curseur avant/après"
            />
          </div>

          {/* Helper caption below slider */}
          <div className="flex items-center justify-between text-xs text-zinc-400 mt-4 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              {isRtl ? "الهالوجين الكلاسيكي (قبل)" : "Halogène standard (Avant)"}
            </span>
            <span className="text-zinc-500 font-medium">
              {isRtl ? "⟵ اسحب المؤشر للمقارنة ⟶" : "⟵ Glissez pour comparer ⟶"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {isRtl ? "عدسات بي ليد 6000K (بعد)" : "Bi-LED Laser 6000K (Après)"}
            </span>
          </div>

          {/* 3 Metric Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">{t.comparison.metric1}</div>
                <div className="text-xs text-zinc-400">{isRtl ? "رؤية أبعد وأوضح ليلاً" : "Visibilité routière accrue"}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">{t.comparison.metric2}</div>
                <div className="text-xs text-zinc-400">{isRtl ? "خط مستقيم يحدد مسار الطريق" : "Délimitation laser parfaite"}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">{t.comparison.metric3}</div>
                <div className="text-xs text-zinc-400">{isRtl ? "لا يعمي السائقين القادمين" : "Conforme aux normes de sécurité"}</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}