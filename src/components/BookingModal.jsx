import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import confetti from "canvas-confetti";
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Wrench,
  X,
  CheckCircle,
  MessageSquare,
  Sparkles,
  AlertCircle
} from "lucide-react";

export function BookingModal({ isOpen, onClose, initialProduct = null }) {
  const { t, isRtl } = useLanguage();
  const { data, createAppointment } = useData();

  const services = data?.services || [];
  const settings = data?.settings || {};
  const whatsappNumber = (settings.whatsappMain || "0561147039").replace(/\s+/g, "");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle: "",
    service: "",
    preferredDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [successApt, setSuccessApt] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialProduct) {
      setFormData((prev) => ({
        ...prev,
        message: `Souhaite installer / acheter : ${initialProduct.nameFr || initialProduct.nameAr}`
      }));
    }
  }, [initialProduct]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim() || !formData.phone.trim() || !formData.vehicle.trim()) {
      setErrorMsg(isRtl ? "يرجى ملء جميع الحقول الإلزامية (*)" : "Veuillez remplir les champs obligatoires (*)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAppointment(formData);
      if (res && res.success) {
        setSuccessApt(res.appointment || formData);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch {
      setErrorMsg(isRtl ? "حدث خطأ، يرجى المحاولة ثانية" : "Une erreur est survenue, veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const getConfirmationWhatsAppUrl = () => {
    const apt = successApt || formData;
    const msg = isRtl
      ? `سلام عليكم ورشة أوتو ليد البليدة، قمت بحجز موعد عبر الموقع:\n- الاسم: ${apt.name}\n- الهاتف: ${apt.phone}\n- السيارة: ${apt.vehicle}\n- الخدمة: ${apt.service || "تجهيز إنارة"}\n- التاريخ المفضل: ${apt.preferredDate}\n${apt.message ? `- ملاحظة: ${apt.message}\n` : ""}يرجى تأكيد موعدي وساعة الحضور. شكراً.`
      : `Bonjour AutoLedBlida, j'ai enregistré mon rendez-vous sur votre site:\n- Nom: ${apt.name}\n- Téléphone: ${apt.phone}\n- Véhicule: ${apt.vehicle}\n- Prestation: ${apt.service || "Installation Phares"}\n- Date souhaitée: ${apt.preferredDate}\n${apt.message ? `- Note: ${apt.message}\n` : ""}Merci de me confirmer l'heure exacte.`;

    const cleanNum = whatsappNumber.replace(/^0/, "");
    return `https://wa.me/213${cleanNum}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-8 rounded-3xl glass-panel border border-zinc-700 bg-brand-surface shadow-2xl p-6 sm:p-8 text-start">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success View */}
        {successApt ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                {t.booking.successModal.title}
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
                {t.booking.successModal.message}
              </p>
            </div>

            {/* Recap Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-start space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">{isRtl ? "العميل:" : "Client :"}</span>
                <span className="font-bold text-white">{successApt.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{isRtl ? "الهاتف:" : "Téléphone :"}</span>
                <span className="font-mono text-zinc-200">{successApt.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{isRtl ? "السيارة:" : "Véhicule :"}</span>
                <span className="font-bold text-brand-redLight">{successApt.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{isRtl ? "اليوم المفضل:" : "Jour souhaité :"}</span>
                <span className="font-semibold text-white">{successApt.preferredDate}</span>
              </div>
            </div>

            {/* 1-Click WhatsApp Forward Button */}
            <div className="space-y-3 pt-2">
              <a
                href={getConfirmationWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-glow-blue"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t.booking.successModal.whatsappBtn}</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
              >
                {t.booking.successModal.closeBtn}
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="space-y-1.5 pr-8 rtl:pr-0 rtl:pl-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-red uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {t.booking.badge}
              </span>
              <h3 className="text-2xl font-black text-white">
                {t.booking.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                {t.booking.subtitle}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Client Name */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-red" />
                  {t.booking.form.name}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.booking.form.namePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              {/* Phone & Vehicle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-red" />
                    {t.booking.form.phone}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t.booking.form.phonePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-brand-red" />
                    {t.booking.form.vehicle}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder={t.booking.form.vehiclePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Service & Preferred Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-brand-red" />
                    {t.booking.form.service}
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  >
                    <option value="">{t.booking.form.selectService}</option>
                    {services.map((s) => (
                      <option key={s.id} value={isRtl ? s.nameAr : s.nameFr}>
                        {isRtl ? s.nameAr : s.nameFr}
                      </option>
                    ))}
                    <option value="Autre">{isRtl ? "خدمة أخرى / فحص مخصص" : "Autre intervention"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-red" />
                    {t.booking.form.date}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">
                  {t.booking.form.message}
                </label>
                <textarea
                  rows="2"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t.booking.form.messagePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-red to-brand-redLight hover:from-brand-redDark hover:to-brand-red text-white font-extrabold text-sm sm:text-base shadow-glow-red transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>{submitting ? t.booking.form.submitting : t.booking.form.submitBtn}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}