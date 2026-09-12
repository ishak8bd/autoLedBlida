import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Zap, Sun, Wrench, ShieldCheck, CheckCircle2 } from "lucide-react";

export function ServiceStrip({ onOpenBooking }) {
  const { t, isRtl } = useLanguage();

  const iconMap = {
    Zap: <Zap className="w-6 h-6 text-brand-redLight" />,
    Sun: <Sun className="w-6 h-6 text-amber-400" />,
    Wrench: <Wrench className="w-6 h-6 text-cyan-400" />,
    ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-400" />
  };

  return (
    <section id="services" className="relative py-16 bg-zinc-950/70 border-y border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
            <span>{isRtl ? "المعايير المعتمدة" : "Prestations & Expertise"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.services.title}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            {t.services.subtitle}
          </p>
        </div>

        {/* 4 Cards Grid matching shop signage */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.services.items.map((item, index) => (
            <div
              key={index}
              className="relative p-6 rounded-2xl glass-panel border border-zinc-800 hover:border-brand-red/50 hover:shadow-glow-red transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Top icon and badge */}
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-brand-red/60 transition-transform">
                  {iconMap[item.icon] || <Zap className="w-6 h-6 text-brand-red" />}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-redLight transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Bottom tag */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? "معتمد في الورشة" : "Garanti Atelier"}
                </span>
                <span className="text-zinc-500 font-mono">0{index + 1}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Workshop Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-brand-surface to-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-start">
            <h4 className="text-xl font-extrabold text-white">
              {isRtl ? "هل تحتاج إلى فحص أو استشارة لإنارة سيارتك؟" : "Besoin d'un conseil ou d'un devis pour votre véhicule ?"}
            </h4>
            <p className="text-sm text-zinc-400">
              {isRtl
                ? "تفضل بزيارتنا في أولاد يعيش بالبليدة أو احجز موعدك لضبط الأضواء على مقاس سيارتك بدقة."
                : "Venez nous rendre visite à Ouled Yaïch (Blida) ou prenez rendez-vous en quelques clics."}
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-sm shadow-glow-red transition-all whitespace-nowrap"
          >
            {t.hero.ctaBooking}
          </button>
        </div>

      </div>
    </section>
  );
}