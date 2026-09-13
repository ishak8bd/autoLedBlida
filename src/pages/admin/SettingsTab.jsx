import React, { useState } from "react";
import {
  Lock,
  Save,
  Check,
  Mail,
  KeyRound,
  Phone,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function SettingsTab() {
  const { t, isRtl } = useLanguage();
  const { data, updateSettings, changeAdminCredentials } = useData();

  const settings = data?.settings || {};
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [authForm, setAuthForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    recoveryEmail: settings.adminAuth?.recoveryEmail || "",
    recoveryEmailPassword: "",
    recoveryPhone: settings.adminAuth?.recoveryPhone || ""
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [authMsg, setAuthMsg] = useState({ type: "", text: "" });
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

      {/* General Info (Hours, Maps) */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base border-b border-zinc-800 pb-3">
          {isRtl ? "معلومات المتجر والخرائط وأوقات العمل" : "Informations Boutique & Horaires"}
        </h4>

        <div className="text-xs">
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

      {/* Admin Security & Recovery Credentials Section */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-5">
        <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{isRtl ? "أمان وحساب الدخول للوحة التحكم" : "Sécurité & Accès Administrateur"}</span>
          </h4>
          <span className="text-[11px] text-zinc-400 font-medium">
            {isRtl ? "كلمة المرور (6+ خانات) ومعلومات الاسترجاع" : "Mot de passe 6+ & Récupération"}
          </span>
        </div>

        {authMsg.text && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              authMsg.type === "success"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/20 border-rose-500/40 text-rose-300"
            }`}
          >
            {authMsg.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{authMsg.text}</span>
          </div>
        )}

        {/* Current Password Verification */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? "كلمة المرور الحالية (للتحقق) *" : "Mot de passe actuel (Requis pour valider) *"}</span>
          </label>
          <div className="relative max-w-md">
            <input
              type={showCurrentPass ? "text" : "password"}
              value={authForm.currentPassword}
              onChange={(e) => setAuthForm({ ...authForm, currentPassword: e.target.value })}
              placeholder={isRtl ? "أدخل كلمة المرور الحالية" : "Entrez votre mot de passe actuel"}
              className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* New Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-zinc-800/60">
          <div>
            <label className="text-zinc-400 block mb-1">
              {isRtl ? "كلمة مرور جديدة (اختياري - اترك فارغاً إذا لا تريد التغيير)" : "Nouveau mot de passe (optionnel - laisser vide pour conserver)"}
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                minLength={6}
                value={authForm.newPassword}
                onChange={(e) => setAuthForm({ ...authForm, newPassword: e.target.value })}
                placeholder="6 caractères min."
                className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
              >
                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-zinc-400 block mb-1">
              {isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirmer le nouveau mot de passe"}
            </label>
            <input
              type="password"
              value={authForm.confirmNewPassword}
              onChange={(e) => setAuthForm({ ...authForm, confirmNewPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Recovery Email, Email Password, and Phone */}
        <div className="space-y-4 pt-1 border-t border-zinc-800/60 text-xs">
          <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-brand-red" />
            <span>{isRtl ? "معلومات الاسترجاع في حال نسيان كلمة المرور :" : "Coordonnées de récupération en cas d'oubli :"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">
                {isRtl ? "بريد الاسترجاع الإلكتروني" : "Email de récupération"}
              </label>
              <input
                type="email"
                value={authForm.recoveryEmail}
                onChange={(e) => setAuthForm({ ...authForm, recoveryEmail: e.target.value })}
                placeholder="admin@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-red"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">
                {isRtl ? "كلمة سر البريد (لتأكيد هويتك عند الاسترجاع)" : "Mot de passe de l'email (pour valider la récupération)"}
              </label>
              <div className="relative">
                <input
                  type={showEmailPass ? "text" : "password"}
                  value={authForm.recoveryEmailPassword}
                  onChange={(e) => setAuthForm({ ...authForm, recoveryEmailPassword: e.target.value })}
                  placeholder={isRtl ? "اترك فارغاً للاحتفاظ بالسابقة" : "Laisser vide pour conserver"}
                  className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPass(!showEmailPass)}
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  {showEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? "رقم الهاتف للاسترجاع (اختياري)" : "Numéro de téléphone de récupération (optionnel)"}</span>
            </label>
            <input
              type="tel"
              value={authForm.recoveryPhone}
              onChange={(e) => setAuthForm({ ...authForm, recoveryPhone: e.target.value })}
              placeholder="05... / 06... / 07..."
              className="w-full max-w-sm px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setAuthMsg({ type: "", text: "" });
            if (!authForm.currentPassword) {
              setAuthMsg({
                type: "error",
                text: isRtl
                  ? "يرجى إدخال كلمة المرور الحالية لتأكيد التعديلات."
                  : "Veuillez entrer votre mot de passe actuel pour confirmer."
              });
              return;
            }
            if (authForm.newPassword) {
              if (authForm.newPassword.length < 6) {
                setAuthMsg({
                  type: "error",
                  text: isRtl
                    ? "يجب أن تكون كلمة المرور الجديدة 6 خانات على الأقل."
                    : "Le nouveau mot de passe doit comporter au moins 6 caractères."
                });
                return;
              }
              if (authForm.newPassword !== authForm.confirmNewPassword) {
                setAuthMsg({
                  type: "error",
                  text: isRtl ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
                });
                return;
              }
            }

            const res = await changeAdminCredentials({
              currentPassword: authForm.currentPassword,
              newPassword: authForm.newPassword || undefined,
              recoveryEmail: authForm.recoveryEmail || undefined,
              recoveryEmailPassword: authForm.recoveryEmailPassword || undefined,
              recoveryPhone: authForm.recoveryPhone
            });

            if (res.success) {
              setAuthMsg({
                type: "success",
                text: isRtl
                  ? "تم تحديث بيانات الأمان بنجاح !"
                  : "Identifiants et accès mis à jour avec succès !"
              });
              setAuthForm((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
                recoveryEmailPassword: ""
              }));
            } else {
              setAuthMsg({
                type: "error",
                text: res.error || (isRtl ? "حدث خطأ أثناء التحديث." : "Erreur lors de la mise à jour.")
              });
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-2 border border-zinc-700 transition-all cursor-pointer shadow-md"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isRtl ? "حفظ وتحديث بيانات الدخول" : "Enregistrer les modifications d'accès"}</span>
        </button>
      </div>
    </div>
  );
}