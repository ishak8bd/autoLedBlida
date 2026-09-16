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
  RotateCcw,
  Send,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function AdminPin({ onAuthenticated, onBackToSite }) {
  const { t, isRtl } = useLanguage();
  const {
    getAdminAuthStatus,
    verifyAdminPassword,
    setupAdminCredentials,
    sendResetOtp,
    checkResetOtp,
    verifyResetOtp,
    recoverAdminPassword,
    checkFallbackCredentials,
    verifyAdminToken
  } = useData();

  // Modes: 'login' | 'setup' | 'recovery_otp' | 'recovery_fallback'
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

  // Option A (OTP by email)
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpResetToken, setOtpResetToken] = useState("");
  const [otpNewPassword, setOtpNewPassword] = useState("");
  const [otpConfirmPassword, setOtpConfirmPassword] = useState("");
  const [showOtpNewPass, setShowOtpNewPass] = useState(false);
  const [showOtpConfirmPass, setShowOtpConfirmPass] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Option B (Direct Fallback Rescue)
  const [fallbackForm, setFallbackForm] = useState({
    email: "",
    emailPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [fallbackVerified, setFallbackVerified] = useState(false);
  const [fallbackToken, setFallbackToken] = useState("");
  const [isVerifyingFallback, setIsVerifyingFallback] = useState(false);
  const [showFallbackPass, setShowFallbackPass] = useState(false);
  const [showFallbackNewPass, setShowFallbackNewPass] = useState(false);
  const [showFallbackConfirmPass, setShowFallbackConfirmPass] = useState(false);
  const [fallbackError, setFallbackError] = useState("");
  const [fallbackSuccess, setFallbackSuccess] = useState("");

  // Check initial configuration and existing session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedToken = localStorage.getItem("autoled_admin_token");
        if (savedToken && verifyAdminToken) {
          const isValid = await verifyAdminToken(savedToken);
          if (isValid && mounted) {
            onAuthenticated();
            return;
          }
        }

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
  }, [verifyAdminToken, onAuthenticated, getAdminAuthStatus]);

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          ? "يرجى إدخال كلمة سر البريد الإلكتروني (أو كلمة سر التطبيق)."
          : "Veuillez entrer le mot de passe de l'email (ou mot de passe d'application)."
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

  // 3. Option A: Send OTP by Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      setOtpError(
        isRtl
          ? "يرجى إدخال عنوان Gmail المسجل."
          : "Veuillez entrer votre adresse Gmail enregistrée."
      );
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");
    setOtpVerified(false);
    setOtpResetToken("");

    const res = await sendResetOtp(otpEmail);
    setIsSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setOtpSuccess(
        isRtl
          ? "تم إرسال رمز الأمان (6 أرقام) إلى بريدك الإلكتروني! تفقد صندوق الرسائل."
          : "Code de vérification (6 chiffres) envoyé avec succès ! Consultez vos emails."
      );
    } else {
      setOtpError(
        res.error ||
          (isRtl
            ? "تعذر إرسال البريد. يمكنك استخدام خيار الاسترجاع الاحتياطي (الخيار ب)."
            : "Échec d'envoi de l'email. Vous pouvez utiliser l'Option B (Secours direct).")
      );
    }
  };

  // 4a. Option A (Step 1): Check OTP Code
  const handleCheckOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");

    if (!otpCode || otpCode.length < 6) {
      setOtpError(
        isRtl ? "يرجى إدخال الرمز المكون من 6 أرقام." : "Veuillez saisir le code à 6 chiffres."
      );
      return;
    }

    setIsVerifyingOtp(true);
    const res = await checkResetOtp({
      email: otpEmail,
      otp: otpCode
    });
    setIsVerifyingOtp(false);

    if (res.success) {
      setOtpVerified(true);
      setOtpResetToken(res.resetToken || "");
      setOtpSuccess(
        isRtl
          ? "الرمز صحيح ! يمكنك الآن تغيير كلمة المرور."
          : "Code correct ! Vous pouvez maintenant modifier votre mot de passe."
      );
    } else {
      setOtpError(
        res.error || (isRtl ? "رمز التحقق غير صحيح." : "Code incorrect.")
      );
    }
  };

  // 4b. Option A (Step 2): Set New Password after OTP verified
  const handleSetNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");

    if (!otpNewPassword || otpNewPassword.length < 6) {
      setOtpError(
        isRtl
          ? "يجب أن تكون كلمة المرور الجديدة 6 خانات على الأقل."
          : "Le nouveau mot de passe doit comporter au moins 6 caractères."
      );
      return;
    }
    if (otpNewPassword !== otpConfirmPassword) {
      setOtpError(
        isRtl ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsSubmitting(true);
    const res = await verifyResetOtp({
      email: otpEmail,
      otp: otpCode,
      resetToken: otpResetToken,
      newPassword: otpNewPassword
    });
    setIsSubmitting(false);

    if (res.success) {
      setOtpSuccess(
        isRtl
          ? "تم تغيير كلمة المرور بنجاح! جاري الدخول..."
          : "Mot de passe modifié avec succès ! Connexion en cours..."
      );
      setTimeout(() => {
        onAuthenticated();
      }, 800);
    } else {
      setOtpError(
        res.error || (isRtl ? "رمز التحقق غير صحيح." : "Code incorrect.")
      );
    }
  };

  // 5a. Option B (Step 1): Check Direct Rescue Credentials (Gmail + Email Password)
  const handleCheckFallbackSubmit = async (e) => {
    e.preventDefault();
    setFallbackError("");
    setFallbackSuccess("");

    if (!fallbackForm.email || !fallbackForm.email.includes("@")) {
      setFallbackError(
        isRtl
          ? "عنوان Gmail غير صحيح أو غير مسجل."
          : "Adresse Gmail incorrecte ou non reconnue."
      );
      return;
    }
    if (!fallbackForm.emailPassword || fallbackForm.emailPassword.trim().length === 0) {
      setFallbackError(
        isRtl
          ? "كلمة سر البريد غير صحيحة."
          : "Mot de passe de l'email incorrect."
      );
      return;
    }

    setIsVerifyingFallback(true);
    const res = await checkFallbackCredentials({
      recoveryEmail: fallbackForm.email,
      recoveryEmailPassword: fallbackForm.emailPassword
    });
    setIsVerifyingFallback(false);

    if (res.success) {
      setFallbackVerified(true);
      setFallbackToken(res.fallbackToken || "");
      setFallbackSuccess(
        isRtl
          ? "تم التحقق من البيانات بنجاح ! أدخل الآن كلمة مرور المدير الجديدة."
          : "Identifiants validés ! Vous pouvez maintenant définir votre nouveau mot de passe admin."
      );
    } else {
      let errorMsg = res.error || (isRtl ? "بيانات الاسترجاع غير صحيحة." : "Identifiants incorrects.");
      if (isRtl) {
        if (res.error && res.error.toLowerCase().includes("adresse gmail")) {
          errorMsg = "عنوان Gmail غير صحيح أو غير مسجل.";
        } else if (res.error && res.error.toLowerCase().includes("mot de passe")) {
          errorMsg = "كلمة سر البريد غير صحيحة.";
        }
      }
      setFallbackError(errorMsg);
    }
  };

  // 5b. Option B (Step 2): Set New Password once credentials are confirmed
  const handleSetNewFallbackPasswordSubmit = async (e) => {
    e.preventDefault();
    setFallbackError("");
    setFallbackSuccess("");

    if (!fallbackForm.newPassword || fallbackForm.newPassword.length < 6) {
      setFallbackError(
        isRtl
          ? "يجب أن تكون كلمة المرور 6 خانات على الأقل."
          : "Le nouveau mot de passe doit comporter au moins 6 caractères."
      );
      return;
    }
    if (fallbackForm.newPassword !== fallbackForm.confirmPassword) {
      setFallbackError(
        isRtl ? "كلمتا المرور غير متطابقتين." : "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setIsSubmitting(true);
    const res = await recoverAdminPassword({
      fallbackToken,
      recoveryEmail: fallbackForm.email,
      recoveryEmailPassword: fallbackForm.emailPassword,
      newPassword: fallbackForm.newPassword
    });
    setIsSubmitting(false);

    if (res.success) {
      setFallbackSuccess(
        isRtl
          ? "تم تغيير كلمة المرور بنجاح! جاري الدخول..."
          : "Mot de passe réinitialisé avec succès ! Connexion en cours..."
      );
      setTimeout(() => {
        onAuthenticated();
      }, 800);
    } else {
      setFallbackError(
        res.error ||
          (isRtl
            ? "تعذر تحديث كلمة المرور."
            : "Impossible de réinitialiser le mot de passe.")
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
                    setMode("recovery_otp");
                    setOtpError("");
                    setOtpSuccess("");
                    setOtpSent(false);
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
                  <span>{isRtl ? "البريد الإلكتروني للاسترجاع (Gmail) *" : "Adresse Gmail de récupération *"}</span>
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

              {/* Email Password / App Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRtl ? "كلمة سر البريد (أو كلمة سر التطبيق) *" : "Mot de passe de l'email (ou code d'application) *"}</span>
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
                <p className="text-[10px] text-zinc-400">
                  {isRtl
                    ? "يُستخدم لإرسال كود التحقق أو كطريقة استرجاع احتياطية فورية."
                    : "Sert à l'envoi du code OTP et comme clé de secours d'urgence."}
                </p>
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

        {/* ================= MODE 3: OPTION A (OTP BY EMAIL VIA NODEMAILER) ================= */}
        {mode === "recovery_otp" && (
          <div className="space-y-5 text-start">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                <Mail className="w-5 h-5 text-brand-red" />
                <span>{isRtl ? "استرجاع بالبريد (كود OTP)" : "Récupération par Email"}</span>
              </h2>
              <p className="text-xs text-zinc-400">
                {isRtl
                  ? "أدخل بريدك الإلكتروني لاستلام رمز تحقق مكون من 6 أرقام"
                  : "Entrez votre Gmail pour recevoir un code de confirmation à 6 chiffres"}
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* Step 1: Request OTP Code */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isRtl ? "عنوان Gmail المسجل :" : "Votre adresse Gmail :"}
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="votre-email@gmail.com"
                    className="w-full py-3 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || !otpEmail}
                  className="w-full py-3.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-xs shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSendingOtp
                      ? isRtl ? "جاري الإرسال عبر البريد..." : "Envoi du code en cours..."
                      : isRtl ? "إرسال رمز التحقق (6 أرقام)" : "Envoyer le code à 6 chiffres"}
                  </span>
                </button>
              </form>
            ) : !otpVerified ? (
              /* Step 2: Enter 6-digit OTP Code ONLY */
              <form onSubmit={handleCheckOtpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      {isRtl ? "رمز التحقق (6 أرقام) *" : "Code reçu par email (6 chiffres) *"}
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      {isRtl ? "إعادة إرسال الكود" : "Renvoyer un code"}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ""));
                      setOtpError("");
                    }}
                    placeholder="123456"
                    className="w-full py-3 text-center tracking-[0.6em] text-2xl font-mono rounded-xl bg-zinc-900 border border-brand-red text-white focus:outline-none shadow-glow-red"
                  />
                  <p className="text-[11px] text-zinc-400 text-center">
                    {isRtl ? `تم إرسال الكود إلى ${otpEmail}` : `Code envoyé à : ${otpEmail}`}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length < 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-xs shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isVerifyingOtp
                      ? (isRtl ? "جاري التحقق من الرمز..." : "Vérification du code...")
                      : (isRtl ? "تأكيد الرمز" : "Vérifier le code")}
                  </span>
                </button>
              </form>
            ) : (
              /* Step 3: OTP is correct -> show Changing Password option */
              <form onSubmit={handleSetNewPasswordSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{isRtl ? `رمز التحقق صحيح (${otpCode})` : `Code vérifié (${otpCode})`}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpVerified(false);
                      setOtpError("");
                      setOtpSuccess("");
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    {isRtl ? "تغيير" : "Modifier le code"}
                  </button>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isRtl ? "كلمة المرور الجديدة (6+ خانات) *" : "Nouveau mot de passe admin (6+ caractères) *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showOtpNewPass ? "text" : "password"}
                      required
                      minLength={6}
                      autoFocus
                      value={otpNewPassword}
                      onChange={(e) => setOtpNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtpNewPass(!showOtpNewPass)}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showOtpNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isRtl ? "تأكيد كلمة المرور الجديدة *" : "Confirmer le nouveau mot de passe *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showOtpConfirmPass ? "text" : "password"}
                      required
                      value={otpConfirmPassword}
                      onChange={(e) => setOtpConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtpConfirmPass(!showOtpConfirmPass)}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showOtpConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-bold text-xs shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (isRtl ? "جاري تغيير كلمة المرور..." : "Enregistrement en cours...")
                      : (isRtl ? "حفظ كلمة المرور والدخول" : "Enregistrer le mot de passe et se connecter")}
                  </span>
                </button>
              </form>
            )}

            {/* Fallback Option B trigger */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMode("recovery_fallback");
                  setFallbackForm((prev) => ({ ...prev, email: otpEmail, newPassword: "", confirmPassword: "" }));
                  setFallbackVerified(false);
                  setFallbackToken("");
                  setFallbackError("");
                  setFallbackSuccess("");
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {isRtl
                    ? "لم يصلك البريد أو تأخر ؟ استخدام الخيار (ب) السريع"
                    : "Email non reçu ou retard ? Utiliser l'Option B (Secours direct)"}
                </span>
              </button>

              <div className="text-center">
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
            </div>
          </div>
        )}

        {/* ================= MODE 4: OPTION B (DIRECT FALLBACK RESCUE) ================= */}
        {mode === "recovery_fallback" && (
          <div className="space-y-5 text-start">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                {fallbackVerified ? (
                  <>
                    <Lock className="w-5 h-5 text-emerald-400" />
                    <span>{isRtl ? "كلمة المرور الجديدة" : "Nouveau Mot de Passe"}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    <span>{isRtl ? "استرجاع فوري (الخيار ب)" : "Secours Direct (Option B)"}</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                {fallbackVerified
                  ? (isRtl
                      ? "تم التحقق من البيانات بنجاح ! عيّن الآن كلمة مرور جديدة لحساب الإدارة"
                      : "Identifiants validés avec succès ! Définissez maintenant votre nouveau mot de passe admin")
                  : (isRtl
                      ? "أدخل عنوان Gmail وكلمة سر البريد المسجلة للتحقق من هويتك وتعيين كلمة مرور جديدة"
                      : "Saisissez votre Gmail et le mot de passe de secours enregistré pour déverrouiller immédiatement")}
              </p>
            </div>

            {fallbackError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fallbackError}</span>
              </div>
            )}

            {fallbackSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{fallbackSuccess}</span>
              </div>
            )}

            {!fallbackVerified ? (
              /* --- ÉTAPE 1 : Vérification Gmail + Mot de passe email --- */
              <form onSubmit={handleCheckFallbackSubmit} className="space-y-3.5">
                {/* Gmail Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-red" />
                    <span>{isRtl ? "عنوان Gmail المسجل *" : "Adresse Gmail enregistrée *"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={fallbackForm.email}
                    onChange={(e) => {
                      setFallbackForm({ ...fallbackForm, email: e.target.value });
                      setFallbackError("");
                    }}
                    placeholder="votre-email@gmail.com"
                    className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                {/* Email Password / App Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isRtl ? "كلمة سر البريد المسجلة *" : "Mot de passe de l'email enregistré *"}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFallbackPass ? "text" : "password"}
                      required
                      value={fallbackForm.emailPassword}
                      onChange={(e) => {
                        setFallbackForm({ ...fallbackForm, emailPassword: e.target.value });
                        setFallbackError("");
                      }}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFallbackPass(!showFallbackPass)}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                    >
                      {showFallbackPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingFallback}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {isVerifyingFallback
                      ? (isRtl ? "جاري التحقق من البيانات..." : "Vérification des identifiants...")
                      : (isRtl ? "التحقق من البيانات" : "Vérifier les identifiants")}
                  </span>
                </button>
              </form>
            ) : (
              /* --- ÉTAPE 2 : Nouveau mot de passe admin (affiché seulement si l'étape 1 est validée) --- */
              <form onSubmit={handleSetNewFallbackPasswordSubmit} className="space-y-3.5">
                {/* Badge Identité validée */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-[10px] text-zinc-400">
                        {isRtl ? "الهوية المؤكدة :" : "Identité confirmée :"}
                      </p>
                      <p className="text-xs font-semibold text-zinc-200 truncate font-mono">
                        {fallbackForm.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFallbackVerified(false);
                      setFallbackSuccess("");
                      setFallbackError("");
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline shrink-0 px-2 py-1 cursor-pointer"
                  >
                    {isRtl ? "تعديل" : "Modifier"}
                  </button>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isRtl ? "كلمة المرور الجديدة (6+ خانات) *" : "Nouveau mot de passe admin (6+ caractères) *"}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFallbackNewPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={fallbackForm.newPassword}
                      onChange={(e) => setFallbackForm({ ...fallbackForm, newPassword: e.target.value })}
                      placeholder={isRtl ? "6 خانات على الأقل" : "Au moins 6 caractères"}
                      className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFallbackNewPass(!showFallbackNewPass)}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                    >
                      {showFallbackNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isRtl ? "تأكيد كلمة المرور الجديدة *" : "Confirmer le nouveau mot de passe *"}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFallbackConfirmPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={fallbackForm.confirmPassword}
                      onChange={(e) => setFallbackForm({ ...fallbackForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFallbackConfirmPass(!showFallbackConfirmPass)}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                    >
                      {showFallbackConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (isRtl ? "جاري الحفظ والدخول..." : "Enregistrement en cours...")
                      : (isRtl ? "تأكيد كلمة المرور والدخول" : "Enregistrer et Déverrouiller")}
                  </span>
                </button>
              </form>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  setMode("recovery_otp");
                  setOtpError("");
                  setOtpSuccess("");
                }}
                className="hover:text-white underline cursor-pointer"
              >
                {isRtl ? "العودة للخيار (أ) بالبريد" : "Revenir à l'Option A (Email)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setLoginError("");
                }}
                className="hover:text-white underline cursor-pointer"
              >
                {isRtl ? "العودة لتسجيل الدخول" : "Retour à la connexion"}
              </button>
            </div>
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