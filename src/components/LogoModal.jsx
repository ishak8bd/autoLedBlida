import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function LogoModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-pointer select-none"
      onClick={onClose}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Explicit Close 'X' Button at top-right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 p-3 rounded-full bg-zinc-900/90 border border-zinc-700/80 hover:border-brand-red text-zinc-300 hover:text-white hover:bg-brand-red/20 transition-all shadow-glow-red cursor-pointer active:scale-90"
        aria-label="Fermer"
      >
        <X className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Pure Logo in Dead Center - Absolutely No Text */}
      <div className="relative flex items-center justify-center animate-zoom-in pointer-events-none">
        {/* Ambient Red Laser Backlight Glow */}
        <div className="absolute w-[80vw] h-[80vw] max-w-[420px] max-h-[420px] bg-brand-red/35 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Rotating Red Neon Energy Ring */}
        <div
          className="absolute w-[74vw] h-[74vw] max-w-[370px] max-h-[370px] rounded-full bg-gradient-to-r from-brand-red via-brand-redLight to-rose-400 animate-spin pointer-events-none opacity-85 blur-[2px]"
          style={{ animationDuration: "9s" }}
        />

        {/* The High-Resolution Eagle Logo */}
        <div className="relative w-[70vw] h-[70vw] max-w-[340px] max-h-[340px] sm:w-[380px] sm:h-[380px] sm:max-w-[380px] sm:max-h-[380px] rounded-full overflow-hidden border-4 border-brand-red shadow-[0_0_60px_rgba(230,0,38,0.85)] bg-black p-1 transition-transform duration-300">
          <img
            src="/logo.png"
            alt="AutoLedBlida Official Eagle Logo"
            className="w-full h-full object-cover rounded-full"
          />
          {/* Shimmer Light Sheen Sweep across the emblem */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-logo-shine pointer-events-none rounded-full" />
        </div>
      </div>
    </div>,
    document.body
  );
}
