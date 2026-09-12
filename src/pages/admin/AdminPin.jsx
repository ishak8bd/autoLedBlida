import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function AdminPin({ onAuthenticated, onBackToSite }) {
  const { t, isRtl } = useLanguage();
  const { verifyPin } = useData();
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const ok = await verifyPin(pinInput);
    if (ok) {
      onAuthenticated();
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-zinc-700 shadow-2xl text-center space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute -inset-1.5 rounded-full bg-brand-red/40 blur-md animate-logo-radar pointer-events-none" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black p-1 animate-logo-periodic">
            <img src="/logo.png" alt="AutoLedBlida Logo" className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-logo-shine pointer-events-none rounded-full" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">{t.admin.gateTitle}</h2>
          <p className="text-xs text-zinc-400">{t.admin.gateSubtitle}</p>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className={`w-full py-4 text-center tracking-[1em] text-2xl font-mono rounded-2xl bg-zinc-900 border ${
                pinError ? "border-rose-500 ring-2 ring-rose-500/50" : "border-zinc-700 focus:border-brand-red"
              } text-white focus:outline-none`}
            />
            {pinError && (
              <p className="text-xs text-rose-400 font-semibold pt-1">
                {t.admin.errorPin}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-sm shadow-glow-red transition-all flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>{t.admin.unlockBtn}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>{t.admin.defaultPinHint}</span>
          <button
            onClick={onBackToSite}
            className="text-zinc-400 hover:text-white underline"
          >
            {isRtl ? "العودة للموقع" : "Retour au site"}
          </button>
        </div>
      </div>
    </div>
  );
}