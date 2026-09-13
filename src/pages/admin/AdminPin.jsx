import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function AdminPin({ onAuthenticated, onBackToSite }) {
  const { t, isRtl } = useLanguage();
  const {
    getAdminAuthStatus,
    verifyAdminPassword,
    setupAdminCredentials,
    recoverAdminPassword
  } = useData();

  // Modes: 'login' | 'setup' | 'recovery'
  const [mode, setMode] = useState("login");
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Login form
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup form
  const [setupForm, setSetupForm] = useState({
    email: "",
    emailPassword: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showSetupEmailPass, setShowSetupEmailPass] = useState(false);
  const [showSetupPass, setShowSetupPass] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");

  // Recovery form
  const [recoveryForm, setRecoveryForm] = useState({
    recoveryEmail: "",
    recoveryEmailPassword: "",
    recoveryPhone: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showRecEmailPass, setShowRecEmailPass] = useState(false);
  const [showRecNewPass, setShowRecNewPass] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

  // Check auth configuration on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getAdminAuthStatus();
        if (mounted) {
          if (!status?.isConfigured) {
            setMode("setup");
          } else {
            setMode("login");
          }
        }
      } catch (err) {
        console.warn("Could not check admin auth status", err);
      } finally {
        if (mounted) setCheckingStatus(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!passwordInput) return;

    setIsSubmitting(true);
    setLoginError("");

    const res = await verifyAdminPassword(passwordInput);
    setIsSubmitting(false);

    if (res.success) {
      onAuthenticated();
    } else if (res.requiresSetup) {
      setMode("setup");
      setSetupError(
        isRtl
          ? "لم يتم إعداد كلمة مرور بعد. يرجى إنشاء بيانات الدخول أولاً."
          : "Aucun mot de passe configuré. Veuillez créer vos accès d'abord."
      );
    } else {
      setLoginError(
        res.error ||
          (isRtl ? "كلمة المرور غير صحيحة. يرجى المحاولة ثانية." : "Mot de passe incorrect. Veuillez réessayer.")
      );
    }
  };

  // 2. Handle Setup Submit
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");
    setSetupSuccess("");

    if (!setupForm.email || !setupForm.email.includes("@")) {
      setSetupError(
        isRtl
          ? "يرجى إدخال بريد إلكتروني صحيح للاسترجاع."
          : "Veuillez entrer une adresse email de récupération valide."
      );
      return;
    }
    if (!setupForm.emailPassword || setupForm.emailPassword.trim().length === 0) {
      setSetupError(
        isRtl
          ? "يرجى إدخال كلمة سر البريد الإلكتروني."
          : "Veuillez entrer le mot de passe de l'email."
      );
      return;
    }
    if (!setupForm.password || setupForm.password.length < 6) {
      setSetupError(
        isRtl
          ? "يجب أن تتكون كلمة المرور من 6 خانات أو أرقام على الأقل."
          : "Le mot de passe admin doit comporter au moins 6 caractères ou chiffres."
      );
      return;
    }
    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupError(
        isRtl ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsSubmitting(true);
    const res = await setupAdminCredentials({
      email: setupForm.email,
      emailPassword: setupForm.emailPassword,
      phone: setupForm.phone,
      password: setupForm.password
    });
    setIsSubmitting(false);

    if (res.success) {
      setSetupSuccess(
        isRtl
          ? "تم إنشاء بيانات الدخول بنجاح! جاري الدخول..."
          : "Identifiants enregistrés avec succès ! Connexion en cours..."
      );
      setTimeout(() => {
        onAuthenticated();
      }, 700);
    } else {
      setSetupError(res.error || (isRtl ? "حدث خطأ أثناء الحفظ." : "Erreur lors de l'enregistrement."));
    }
  };

  // 3. Handle Recovery Submit
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");

    if (!recoveryForm.recoveryEmail || !recoveryForm.recoveryEmail.includes("@")) {
      setRecoveryError(
        isRtl
          ? "يرجى إدخال بريد الاسترجاع المسجل."
          : "Veuillez entrer l'email de récupération enregistré."
      );
      return;
    }
    if (!recoveryForm.recoveryEmailPassword) {
      setRecoveryError(
        isRtl
          ? "يرجى إدخال كلمة سر البريد الإلكتروني."
          : "Veuillez entrer le mot de passe de l'email."
      );
      return;
    }
    if (!recoveryForm.newPassword || recoveryForm.newPassword.length < 6) {
      setRecoveryError(
        isRtl
          ? "يجب أن تكون كلمة المرور الجديدة 6 خانات أو أكثر."
          : "Le nouveau mot de passe doit comporter au moins 6 caractères."
      );
      return;
    }
    if (recoveryForm.newPassword !== recoveryForm.confirmPassword) {
      setRecoveryError(
        isRtl ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsSubmitting(true);
    const res = await recoverAdminPassword({
      recoveryEmail: recoveryForm.recoveryEmail,
      recoveryEmailPassword: recoveryForm.recoveryEmailPassword,
      recoveryPhone: recoveryForm.recoveryPhone,
      newPassword: recoveryForm.newPassword
    });
    setIsSubmitting(false);

    if (res.success) {
      setRecoverySuccess(
        isRtl
          ? "تم استرجاع وتحديث كلمة المرور بنجاح! جاري الدخول..."
          : "Mot de passe réinitialisé avec succès ! Accès en cours..."
      );
      setTimeout(() => {
        onAuthenticated();
      }, 900);
    } else {
      setRecoveryError(
        res.error ||
          (isRtl
            ? "البريد الإلكتروني أو كلمة سر البريد غير صحيحة."
            : "Email de récupération ou mot de passe de l'email incorrect.")
      );
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel border border-zinc-700 shadow-2xl text-center space-y-6">
        
        {/* Animated Brand Radar Logo */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute -inset-1.5 rounded-full bg-brand-red/40 blur-md animate-logo-radar pointer-events-none" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black p-1 animate-logo-periodic">
            <img src="/logo.png" alt="AutoLedBlida Logo" className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-logo-shine pointer-events-none rounded-full" />
          </div>
        </div>

        {/* ================= MODE 1: LOGIN ================= */}
        {mode === "login" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">
                {isRtl ? "دخول لوحة التحكم" : "Espace Administration"}
              </h2>
              <p className="text-xs text-zinc-400">
                {isRtl
                  ? "يرجى إدخال كلمة المرور للمتابعة (6 خانات+)"
                  : "Veuillez saisir votre mot de passe pour continuer (6+ caractères)"}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  {isRtl ? "كلمة المرور :" : "Mot de passe admin :"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError("");
                    }}
                    placeholder="••••••••"
                    className={`w-full py-3.5 px-4 pr-11 rtl:pr-4 rtl:pl-11 text-base font-mono rounded-2xl bg-zinc-900 border ${
                      loginError ? "border-rose-500 ring-2 ring-rose-500/50" : "border-zinc-700 focus:border-brand-red"
                    } text-white focus:outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Afficher/Masquer mot de passe"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {loginError && (
                  <p className="text-xs text-rose-400 font-semibold pt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !passwordInput}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-sm shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isRtl ? "جاري التحقق..." : "Vérification..."
                    : isRtl ? "تسجيل الدخول" : "Déverrouiller"}
                </span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("recovery");
                    setRecoveryError("");
                    setRecoverySuccess("");
                  }}
                  className="text-xs text-zinc-400 hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {isRtl ? "نسيت كلمة المرور ؟" : "Mot de passe oublié ?"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODE 2: SETUP INITIAL ================= */}
        {mode === "setup" && (
          <div className="space-y-5 text-start">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">
                {isRtl ? "إعداد بيانات دخول الإدارة" : "Configuration de l'Accès Admin"}
              </h2>
              <p className="text-xs text-zinc-400">
                {isRtl
                  ? "حدد كلمة مرور قوية (6+ خانات) ومعلومات الاسترجاع في حال النسيان"
                  : "Définissez votre mot de passe (6+ caractères) et vos coordonnées de récupération"}
              </p>
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{setupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-3.5">
              {/* Recovery Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-red" />
                  <span>{isRtl ? "البريد الإلكتروني للاسترجاع *" : "Email de récupération *"}</span>
                </label>
                <input
                  type="email"
                  required
                  value={setupForm.email}
                  onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                  placeholder="ex. admin@gmail.com"
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* Email Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRtl ? "كلمة سر البريد الإلكتروني *" : "Mot de passe de l'email *"}</span>
                </label>
                <div className="relative">
                  <input
                    type={showSetupEmailPass ? "text" : "password"}
                    required
                    value={setupForm.emailPassword}
                    onChange={(e) => setSetupForm({ ...setupForm, emailPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupEmailPass(!showSetupEmailPass)}
                    className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    {showSetupEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Optional Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isRtl ? "رقم الهاتف للاسترجاع (اختياري)" : "Téléphone de récupération (optionnel)"}
                  </span>
                </label>
                <input
                  type="tel"
                  value={setupForm.phone}
                  onChange={(e) => setSetupForm({ ...setupForm, phone: e.target.value })}
                  placeholder="05 / 06 / 07..."
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* Admin Password */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isRtl ? "إنشاء كلمة مرور الإدارة (6+ خانات) *" : "Créer le mot de passe admin (6+ caractères) *"}</span>
                </label>
                <div className="relative">
                  <input
                    type={showSetupPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={setupForm.password}
                    onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                    placeholder="Au moins 6 caractères / chiffres"
                    className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPass(!showSetupPass)}
                    className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    {showSetupPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  {isRtl ? "تأكيد كلمة مرور الإدارة *" : "Confirmer le mot de passe admin *"}
                </label>
                <input
                  type="password"
                  required
                  value={setupForm.confirmPassword}
                  onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full py-2.5 px-3.5 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? "يُستخدم البريد وكلمة سره ورقم الهاتف فقط لاسترجاع كلمة المرور في حال نسيانها."
                    : "L'email et le mot de passe de l'email sont utilisés exclusivement pour récupérer votre mot de passe si vous l'oubliez."}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-xs shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? (isRtl ? "جاري الحفظ..." : "Enregistrement...") : (isRtl ? "حفظ والدخول" : "Créer et Déverrouiller")}</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= MODE 3: RECOVERY ================= */}
        {mode === "recovery" && (
          <div className="space-y-5 text-start">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">
                {isRtl ? "استرجاع كلمة المرور" : "Récupération du Mot de Passe"}
              </h2>
              <p className="text-xs text-zinc-400">
                {isRtl
                  ? "أدخل بريد الاسترجاع وكلمة سره لتعيين كلمة مرور جديدة"
                  : "Entrez votre email de récupération et son mot de passe pour réinitialiser votre accès"}
              </p>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3.5">
              {/* Recovery Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-red" />
                  <span>{isRtl ? "البريد الإلكتروني للاسترجاع *" : "Email de récupération *"}</span>
                </label>
                <input
                  type="email"
                  required
                  value={recoveryForm.recoveryEmail}
                  onChange={(e) =>
                    setRecoveryForm({ ...recoveryForm, recoveryEmail: e.target.value })
                  }
                  placeholder="admin@gmail.com"
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* Email Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRtl ? "كلمة سر البريد الإلكتروني *" : "Mot de passe de l'email *"}</span>
                </label>
                <div className="relative">
                  <input
                    type={showRecEmailPass ? "text" : "password"}
                    required
                    value={recoveryForm.recoveryEmailPassword}
                    onChange={(e) =>
                      setRecoveryForm({ ...recoveryForm, recoveryEmailPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecEmailPass(!showRecEmailPass)}
                    className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    {showRecEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Optional Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isRtl ? "رقم الهاتف (اختياري)" : "Numéro de téléphone (optionnel)"}
                  </span>
                </label>
                <input
                  type="tel"
                  value={recoveryForm.recoveryPhone}
                  onChange={(e) =>
                    setRecoveryForm({ ...recoveryForm, recoveryPhone: e.target.value })
                  }
                  placeholder="05 / 06 / 07..."
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isRtl ? "كلمة المرور الجديدة (6+ خانات) *" : "Nouveau mot de passe (6+ caractères) *"}</span>
                </label>
                <div className="relative">
                  <input
                    type={showRecNewPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={recoveryForm.newPassword}
                    onChange={(e) =>
                      setRecoveryForm({ ...recoveryForm, newPassword: e.target.value })
                    }
                    placeholder="Au moins 6 caractères"
                    className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecNewPass(!showRecNewPass)}
                    className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    {showRecNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  {isRtl ? "تأكيد كلمة المرور الجديدة *" : "Confirmer le nouveau mot de passe *"}
                </label>
                <input
                  type="password"
                  required
                  value={recoveryForm.confirmPassword}
                  onChange={(e) =>
                    setRecoveryForm({ ...recoveryForm, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full py-2.5 px-3.5 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-xs shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isRtl ? "جاري التحقق..." : "Vérification..."
                    : isRtl ? "إعادة تعيين والدخول" : "Réinitialiser et Accéder"}
                </span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setLoginError("");
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                  <span>{isRtl ? "العودة لتسجيل الدخول" : "Retour à la connexion"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Global Footer: Return to Website */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>AutoLedBlida</span>
          <button
            type="button"
            onClick={onBackToSite}
            className="text-zinc-400 hover:text-white underline cursor-pointer"
          >
            {isRtl ? "العودة للموقع" : "Retour au site"}
          </button>
        </div>

      </div>
    </div>
  );
}

// Named alias
export const AdminGate = AdminPin;