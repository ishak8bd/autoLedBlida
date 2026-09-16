import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { X } from "lucide-react";

export function HolidayBanner() {
  const { isRtl } = useLanguage();
  const { data } = useData();
  const [dismissed, setDismissed] = useState(false);

  const banner = data?.settings?.holidayBanner;
  if (!banner || !banner.enabled || dismissed) return null;

  const title = isRtl ? banner.titleAr : banner.titleFr;
  const message = isRtl ? banner.messageAr : banner.messageFr;
  const badge = isRtl ? banner.badgeAr : banner.badgeFr;

  return (
    <div className="relative bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border-b border-brand-red/30 py-2.5 px-4 sm:px-6 z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            {badge && badge.trim() && (
              <span className="px-2 py-0.5 rounded-full bg-brand-red text-white text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
                {badge.trim()}
              </span>
            )}
            <span className="font-bold text-white tracking-wide">{title?.trim()} :</span>
            <span className="text-zinc-300">{message}</span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}