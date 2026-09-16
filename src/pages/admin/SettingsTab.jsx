import React, { useState, useEffect } from "react";
import {
  Lock,
  Save,
  Check,
  Mail,
  KeyRound,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Server,
  Activity,
  Power,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function SettingsTab() {
  const { t, isRtl } = useLanguage();
  const { data, updateSettings, changeAdminCredentials, getUptimeRobotStatus, toggleUptimeRobot } = useData();

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

  // UptimeRobot Keep-Alive state
  const [uptimeData, setUptimeData] = useState(null);
  const [uptimeLoading, setUptimeLoading] = useState(true);
  const [uptimeToggling, setUptimeToggling] = useState(false);
  const [uptimeMsg, setUptimeMsg] = useState("");

  const loadUptimeStatus = async () => {
    setUptimeLoading(true);
    setUptimeMsg("");
    try {
      const res = await getUptimeRobotStatus();
      setUptimeData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setUptimeLoading(false);
    }
  };

  useEffect(() => {
    loadUptimeStatus();
  }, []);

  const handleToggleUptime = async () => {
    if (!uptimeData?.monitor) return;
    const currentActive = uptimeData.monitor.isActive;
    setUptimeToggling(true);
    setUptimeMsg("");
    const res = await toggleUptimeRobot(uptimeData.monitor.id, !currentActive);
    setUptimeToggling(false);
    if (res.success) {
      setUptimeMsg(res.message);
      await loadUptimeStatus();
    } else {
      setUptimeMsg(res.error || "Erreur lors du changement de statut");
    }
  };

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setSettingsForm((prev) => ({
        ...settings,
        ...prev
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (settings?.adminAuth) {
      setAuthForm((prev) => ({
        ...prev,
        recoveryEmail: prev.recoveryEmail || settings.adminAuth.recoveryEmail || "",
        recoveryPhone: prev.recoveryPhone || settings.adminAuth.recoveryPhone || ""
      }));
    }
  }, [settings?.adminAuth]);

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

        {/* Recovery Email */}
        <div className="space-y-3 pt-1 border-t border-zinc-800/60 text-xs">
          <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-brand-red" />
            <span>{isRtl ? "معلومات الاسترجاع في حال نسيان كلمة المرور :" : "Coordonnées de récupération en cas d'oubli :"}</span>
          </div>

          <div className="max-w-md">
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
            <p className="text-[10px] text-zinc-500 mt-1">
              {isRtl
                ? "يتم إرسال رمز التحقق OTP إلى هذا البريد في حال نسيان كلمة المرور (الخيار أ)."
                : "Le code de vérification OTP vous sera envoyé à cette adresse en cas d'oubli (Option A)."}
            </p>
          </div>

          <div className="max-w-md">
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-400 block text-xs">
                {isRtl ? "كلمة سر بريد الاسترجاع (الخيار ب للاسترجاع الفوري)" : "Mot de passe de l'email de récupération"}
              </label>
              {data?.settings?.adminAuth?.hasRecoveryEmailPassword ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isRtl ? "مُعيّن ونشط" : "Actif dans la base"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <AlertCircle className="w-3 h-3" />
                  <span>{isRtl ? "غير مُعيّن بعد" : "Non défini"}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showEmailPass ? "text" : "password"}
                value={authForm.recoveryEmailPassword}
                onChange={(e) => setAuthForm({ ...authForm, recoveryEmailPassword: e.target.value })}
                placeholder={isRtl ? "أدخل كلمة سر جديدة لتغييرها في أي وقت (أو اترك فارغاً للحفظ)" : "Saisissez un nouveau mot de passe pour changer (ou vide pour conserver)"}
                className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
              />
              <button
                type="button"
                onClick={() => setShowEmailPass(!showEmailPass)}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              {isRtl
                ? "يمكنك تغيير كلمة سر بريد الاسترجاع في أي وقت هنا. ستُستخدم فوراً في الخيار (ب) للطوارئ."
                : "Vous pouvez modifier ce mot de passe de secours à tout moment ici. Il sera utilisable immédiatement dans l'Option B."}
            </p>
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

      {/* ================= UPTIMEROBOT KEEP-ALIVE CARD ================= */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <span>{isRtl ? "حالة الخادم وتفادي وضع السكون (UptimeRobot)" : "Performance Serveur & Anti-Veille (UptimeRobot)"}</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                {isRtl
                  ? "التحكم في تشغيل أو إيقاف إبقاء موقع AutoLedBlida شغالاً 24/7 دون تأخير 50 ثانية"
                  : "Contrôlez l'activité 24/7 pour éviter le délai de 50s au démarrage"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadUptimeStatus}
            disabled={uptimeLoading}
            title={isRtl ? "تحديث الحالة" : "Rafraîchir"}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${uptimeLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {uptimeMsg && (
          <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-zinc-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-red shrink-0" />
            <span>{uptimeMsg}</span>
          </div>
        )}

        {uptimeLoading ? (
          <div className="py-6 flex items-center justify-center text-xs text-zinc-500 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-red" />
            <span>{isRtl ? "جاري تحميل بيانات UptimeRobot..." : "Chargement du statut UptimeRobot..."}</span>
          </div>
        ) : !uptimeData?.hasMonitor ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {isRtl ? "لم يتم العثور على مراقب (Monitor) في حساب UptimeRobot بعد." : "Aucun moniteur configuré sur votre compte UptimeRobot pour le moment."}
                </p>
                <p className="text-zinc-400 text-[11px]">
                  {isRtl
                    ? "لتفعيل التحكم المباشر من هنا، أنشئ أولاً المراقب في حسابك على UptimeRobot برابط موقعك على Render."
                    : "Pour activer le bouton ON/OFF depuis ce panneau, ajoutez d'abord votre site dans UptimeRobot (+ Add New Monitor) avec l'URL de votre site Render."}
                </p>
              </div>
            </div>
            <a
              href="https://uptimerobot.com/dashboard#monitors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all"
            >
              <span>{isRtl ? "إنشاء المراقب على UptimeRobot" : "Ouvrir UptimeRobot pour créer le moniteur"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      uptimeData.monitor.isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                    }`}
                  />
                  <span className="text-xs font-bold text-white">
                    {uptimeData.monitor.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      uptimeData.monitor.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {uptimeData.monitor.isActive
                      ? (isRtl ? "مفعّل 24/7 (بدون سكون)" : "Actif 24/7 (Sans veille)")
                      : (isRtl ? "في وضع السكون (متوقف)" : "En pause (Veille autorisée)")}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate max-w-md font-mono">
                  {uptimeData.monitor.url}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {isRtl
                    ? `فحص دوري كل ${Math.round(uptimeData.monitor.interval / 60)} دقائق`
                    : `Intervalle de ping : toutes les ${Math.round(uptimeData.monitor.interval / 60)} minutes`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleUptime}
                disabled={uptimeToggling}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                  uptimeData.monitor.isActive
                    ? "bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {uptimeToggling
                    ? (isRtl ? "جاري التحديث..." : "Modification...")
                    : uptimeData.monitor.isActive
                    ? (isRtl ? "إيقاف (السماح بالنوم)" : "Mettre en veille (Pause)")
                    : (isRtl ? "تفعيل الحفاظ على الخادم 24/7" : "Activer le mode 24/7")}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1">
              <p className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Activity className="w-3.5 h-3.5 text-brand-red" />
                <span>{isRtl ? "كيف يعمل هذا التحكم ؟" : "Comment fonctionne ce contrôle ?"}</span>
              </p>
              <p>
                {isRtl
                  ? "• عند التفعيل (Actif): يقوم UptimeRobot بإرسال إشارة للموقع كل 5-10 دقائق لمنع خادم Render من النوم (0 ثانية تأخير للزبائن)."
                  : "• Quand Actif (ON) : UptimeRobot ping votre serveur toutes les 5 à 10 minutes pour empêcher Render de s'endormir (0s de délai)."}
              </p>
              <p>
                {isRtl
                  ? "• عند الإيقاف (Pause): يتوقف UptimeRobot، مما يسمح لـ Render بالنوم بعد 15 دقيقة لتوفير الساعات المجانية."
                  : "• Quand En pause (OFF) : UptimeRobot s'arrête et Render peut s'endormir après 15 min d'inactivité pour économiser vos heures gratuites."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}