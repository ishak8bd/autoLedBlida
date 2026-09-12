import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Sparkles, ExternalLink, Play, CheckCircle2 } from "lucide-react";

export function Gallery({ onOpenBooking }) {
  const { t, isRtl } = useLanguage();

  const showcaseItems = [
    {
      id: "bmw-angel",
      title: isRtl ? "بي إم دبليو الفئة الثالثة - عدسات بي ليد أوزوم" : "BMW Série 3 - Projecteurs Bi-LED AOZOOM",
      tag: isRtl ? "ريتروفيت احترافي" : "Retrofit Optique",
      image: "/bmw-hero.jpg",
      desc: isRtl
        ? "تعديل الفوانيس مع حلقات أنجل آيز ناصعة وعدسات ليزرية ذات خط قطع دقيق."
        : "Montage de lentilles Bi-LED 3 pouces avec anneaux angel eyes blanc pur."
    },
    {
      id: "fluence-custom",
      title: isRtl ? "رونو فلوينس - تعديل وتحديث كامل للإنارة" : "Renault Fluence - Rénovation & Full LED",
      tag: isRtl ? "تعديل مخصص" : "Sur Mesure",
      image: "/fluence-retrofit.jpg",
      desc: isRtl
        ? "ترقية مصابيح الكود والفار مع لمبات ليد كانباص قوية بدون أخطاء."
        : "Pack complet feux de croisement et route GPNE haute puissance."
    },
    {
      id: "workshop-proof",
      title: isRtl ? "اختبار ميزانية وعدسات بي ليد أوزوم 2024" : "Test Faisceau & Réglage Bi-LED AOZOOM",
      tag: isRtl ? "ميزانية الأضواء" : "Test Banc Optique",
      image: "/aozoom-beam-wall.jpg",
      desc: isRtl
        ? "ضبط خط القطع المستقيم والتوزيع المتجانس للأشعة على لوحة المعايرة بالورشة."
        : "Alignement précis au banc d'optique pour une coupure nette sans éblouissement."
    }
  ];

  return (
    <section id="realisations" className="py-20 bg-brand-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl text-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t.gallery.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t.gallery.title}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              {t.gallery.subtitle}
            </p>
          </div>

          {/* TikTok Direct Callout */}
          <a
            href="https://www.tiktok.com/@auto.led.blida"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-brand-red text-white text-xs sm:text-sm font-bold flex items-center gap-3 transition-all hover:shadow-glow-red shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-zinc-700">
              <Play className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <div className="text-start">
              <div className="font-extrabold text-white">@auto.led.blida</div>
              <div className="text-[11px] text-zinc-400">95.1K {isRtl ? "متابع" : "abonnés"} • 370K likes</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {showcaseItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl glass-panel border border-zinc-800 overflow-hidden flex flex-col group hover:border-brand-red/50 hover:shadow-glow-red transition-all duration-300"
            >
              <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700 text-xs font-bold text-white shadow-sm">
                    {item.tag}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between text-start space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-redLight transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isRtl ? "تم في ورشة البليدة" : "Réalisé en atelier"}
                  </span>
                  <button
                    onClick={onOpenBooking}
                    className="text-xs font-bold text-brand-redLight hover:text-white transition-colors"
                  >
                    {isRtl ? "طلب نفس التعديل ←" : "Demander le même →"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}