import React, { useState } from "react";
import { Lock, Save, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function SettingsTab() {
  const { t, isRtl } = useLanguage();
  const { data, updateSettings, changePin } = useData();

  const settings = data?.settings || {};
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [pinForm, setPinForm] = useState({ oldPin: "", newPin: "" });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  return (
    <div className="space-y-8 text-start max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-white">{t.admin.settingsTab.title}</h3>
        <p className="text-xs text-zinc-400">{t.admin.settingsTab.subtitle}</p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Holiday / Announcement Banner Card */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h4 className="font-bold text-white text-base">
            {t.admin.settingsTab.bannerSection}
          </h4>
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.holidayBanner?.enabled}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: {
                    ...settingsForm.holidayBanner,
                    enabled: e.target.checked
                  }
                })
              }
              className="w-4 h-4 rounded text-brand-red bg-zinc-900 border-zinc-700"
            />
            <span>{t.admin.settingsTab.bannerEnabled}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.bannerTitleFr}</label>
            <input
              type="text"
              value={settingsForm.holidayBanner?.titleFr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, titleFr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.bannerTitleAr}</label>
            <input
              type="text"
              value={settingsForm.holidayBanner?.titleAr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, titleAr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">
              {t.admin.settingsTab.bannerBadgeFr} <span className="text-zinc-500 font-normal">({isRtl ? "اختياري" : "Optionnel - laisser vide pour masquer"})</span>
            </label>
            <input
              type="text"
              placeholder={isRtl ? "اتركه فارغاً لإخفاء الشارة" : "Laisser vide pour ne pas afficher de badge"}
              value={settingsForm.holidayBanner?.badgeFr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, badgeFr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">
              {t.admin.settingsTab.bannerBadgeAr} <span className="text-zinc-500 font-normal">({isRtl ? "اختياري" : "Optionnel"})</span>
            </label>
            <input
              type="text"
              placeholder={isRtl ? "اتركه فارغاً لإخفاء الشارة" : "Laisser vide pour masquer"}
              value={settingsForm.holidayBanner?.badgeAr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, badgeAr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.bannerMsgFr}</label>
            <textarea
              rows={2}
              value={settingsForm.holidayBanner?.messageFr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, messageFr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.bannerMsgAr}</label>
            <textarea
              rows={2}
              value={settingsForm.holidayBanner?.messageAr || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  holidayBanner: { ...settingsForm.holidayBanner, messageAr: e.target.value }
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* General Info (Hours, Wilayas, Maps) */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base border-b border-zinc-800 pb-3">
          {isRtl ? "معلومات المتجر والخرائط والولايات" : "Informations Boutique & Horaires"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.wilayasCount}</label>
            <input
              type="number"
              value={settingsForm.deliveryWilayas || 69}
              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryWilayas: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.mapsLink}</label>
            <input
              type="text"
              value={settingsForm.googleMapsUrl || ""}
              onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.hoursFr}</label>
            <input
              type="text"
              value={settingsForm.openingHoursFr || ""}
              onChange={(e) => setSettingsForm({ ...settingsForm, openingHoursFr: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.hoursAr}</label>
            <input
              type="text"
              value={settingsForm.openingHoursAr || ""}
              onChange={(e) => setSettingsForm({ ...settingsForm, openingHoursAr: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            await updateSettings(settingsForm);
            setSaveSuccessMsg(t.admin.settingsTab.savedSuccess);
            setTimeout(() => setSaveSuccessMsg(""), 3000);
          }}
          className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{t.admin.settingsTab.saveSettingsBtn}</span>
        </button>
      </div>

      {/* PIN Security Section */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>{t.admin.settingsTab.pinSection}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.oldPin}</label>
            <input
              type="password"
              value={pinForm.oldPin}
              onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value })}
              placeholder="1234"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">{t.admin.settingsTab.newPin}</label>
            <input
              type="password"
              value={pinForm.newPin}
              onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
              placeholder="Code à 4 chiffres"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            const res = await changePin(pinForm.oldPin, pinForm.newPin);
            if (res.success) {
              alert("Code PIN mis à jour avec succès !");
              setPinForm({ oldPin: "", newPin: "" });
            } else {
              alert("Erreur: " + res.error);
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-2 border border-zinc-700"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{t.admin.settingsTab.updatePinBtn}</span>
        </button>
      </div>
    </div>
  );
}