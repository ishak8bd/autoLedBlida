import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { Phone, MessageSquare, Calendar } from "lucide-react";

export function MobileBar({ onOpenBooking }) {
  const { t } = useLanguage();
  const { data } = useData();

  const settings = data?.settings || {};
  const phoneNumbers = settings.phoneNumbers || [];
  const primaryPhone = phoneNumbers.find((p) => p.isPrimary) || phoneNumbers[0] || { number: "0561147039" };
  const whatsappNumber = (settings.whatsappMain || primaryPhone.number).replace(/\s+/g, "");

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-2 px-3 shadow-2xl">
      <div className="grid grid-cols-3 gap-2">
        {/* Direct Call */}
        <a
          href={`tel:${primaryPhone.number}`}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors"
        >
          <Phone className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[11px] font-bold">{t.mobileBar.call}</span>
        </a>

        {/* WhatsApp Direct */}
        <a
          href={`https://wa.me/213${whatsappNumber.replace(/^0/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-700/80 border border-emerald-600/60 text-white hover:bg-emerald-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4 fill-current mb-1" />
          <span className="text-[11px] font-bold">{t.mobileBar.whatsapp}</span>
        </a>

        {/* Book Appointment Modal Trigger */}
        <button
          onClick={onOpenBooking}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight text-white shadow-glow-red font-bold"
        >
          <Calendar className="w-4 h-4 mb-1" />
          <span className="text-[11px] font-bold">{t.mobileBar.book}</span>
        </button>
      </div>
    </div>
  );
}