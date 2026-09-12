import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import { ALGERIA_WILAYAS } from "../i18n/translations";
import confetti from "canvas-confetti";
import {
  ShoppingBag,
  Truck,
  User,
  Phone,
  MapPin,
  Car,
  X,
  CheckCircle,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  ShieldCheck
} from "lucide-react";

export function OrderModal({ isOpen, onClose, product = null }) {
  const { t, isRtl } = useLanguage();
  const { data, createOrder } = useData();

  const settings = data?.settings || {};
  const whatsappNumber = (settings.whatsappMain || "0561147039").replace(/\s+/g, "");

  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    wilaya: "",
    commune: "",
    vehicleNote: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSuccessOrder(null);
      setErrorMsg("");
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.price) || 0;
  const totalPrice = unitPrice * quantity;
  const productTitle = isRtl ? product.nameAr || product.nameFr : product.nameFr;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.wilaya.trim()) {
      setErrorMsg(isRtl ? "يرجى ملء الاسم، رقم الهاتف والولاية (*)" : "Veuillez remplir le nom, téléphone et la wilaya (*)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        wilaya: formData.wilaya.trim(),
        commune: formData.commune.trim(),
        quantity,
        vehicleNote: formData.vehicleNote.trim(),
        productId: product.id,
        productName: product.nameFr,
        productImage: product.image || "/biled-lens.jpg",
        productPrice: unitPrice
      };

      const res = await createOrder(payload);
      if (res && res.success) {
        setSuccessOrder(res.order || { ...payload, id: "cmd-" + Date.now(), total: totalPrice });
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      } else {
        setErrorMsg(isRtl ? "تعذر إرسال الطلب، يرجى المحاولة ثانية" : "Échec de l'enregistrement, veuillez réessayer.");
      }
    } catch {
      setErrorMsg(isRtl ? "حدث خطأ غير متوقع، يرجى المحاولة ثانية" : "Une erreur est survenue, veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const getConfirmationWhatsAppUrl = () => {
    const order = successOrder || {
      id: "CMD-" + Date.now(),
      customerName: formData.customerName,
      phone: formData.phone,
      wilaya: formData.wilaya,
      commune: formData.commune,
      vehicleNote: formData.vehicleNote,
      total: totalPrice
    };

    const msg = isRtl
      ? `سلام عليكم متجر أوتو ليد البليدة، قمت بتأكيد طلبية شراء عبر الموقع:\n- رقم الطلبية: ${order.id}\n- المنتج: ${productTitle}\n- الكمية: ${quantity}\n- المجموع: ${order.total?.toLocaleString()} د.ج\n- الاسم: ${order.customerName}\n- الهاتف: ${order.phone}\n- ولاية التوصيل: ${order.wilaya}\n${order.commune ? `- البلدية / العنوان: ${order.commune}\n` : ""}${order.vehicleNote ? `- نوع السيارة: ${order.vehicleNote}\n` : ""}يرجى تأكيد إرسال الطرد مع شركة التوصيل. شكراً.`
      : `Bonjour AutoLedBlida, j'ai passé commande sur votre site:\n- Réf Commande: ${order.id}\n- Produit: ${product.nameFr}\n- Quantité: ${quantity}\n- Total: ${order.total?.toLocaleString()} DZD\n- Nom: ${order.customerName}\n- Téléphone: ${order.phone}\n- Wilaya de livraison: ${order.wilaya}\n${order.commune ? `- Commune / Adresse: ${order.commune}\n` : ""}${order.vehicleNote ? `- Véhicule: ${order.vehicleNote}\n` : ""}Merci de confirmer l'expédition avec le livreur.`;

    const cleanNum = whatsappNumber.replace(/^0/, "");
    return `https://wa.me/213${cleanNum}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-8 rounded-3xl glass-panel border border-zinc-700 bg-brand-surface shadow-2xl p-6 sm:p-8 text-start max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* State A: Success Confirmation Modal */}
        {successOrder ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-red">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-brand-red font-mono text-xs font-bold">
                {t.order.successModal.orderId} : {successOrder.id}
              </span>
              <h3 className="text-2xl font-black text-white">
                {t.order.successModal.title}
              </h3>
              <p className="text-zinc-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                {t.order.successModal.message}
              </p>
            </div>

            {/* Order Recap Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-start space-y-2.5 text-xs">
              <div className="flex items-center gap-3 pb-2 border-b border-zinc-800/80">
                <img
                  src={product.image || "/biled-lens.jpg"}
                  alt={productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{productTitle}</div>
                  <div className="text-zinc-400 text-[11px]">
                    Quantité : <span className="text-white font-bold">{quantity}</span> × {unitPrice.toLocaleString()} DZD
                  </div>
                </div>
                <div className="font-mono font-black text-brand-redLight text-sm">
                  {totalPrice.toLocaleString()} DZD
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px] pt-1">
                <div>
                  <span className="text-zinc-500 block">Client :</span>
                  <span className="text-white font-semibold">{successOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Téléphone :</span>
                  <span className="text-white font-semibold">{successOrder.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block">Destination :</span>
                  <span className="text-white font-semibold">
                    {successOrder.wilaya} {successOrder.commune ? `(${successOrder.commune})` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={getConfirmationWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t.order.successModal.whatsappBtn}</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-800 transition-colors"
              >
                {t.order.successModal.closeBtn}
              </button>
            </div>
          </div>
        ) : (
          /* State B: Order Input Form */
          <div className="space-y-5">
            
            {/* Modal Header */}
            <div className="space-y-1.5 border-b border-zinc-800/80 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red text-[11px] font-bold uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t.order.badge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {t.order.title}
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t.order.subtitle}</span>
              </p>
            </div>

            {/* Product Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <img
                src={product.image || "/biled-lens.jpg"}
                alt={productTitle}
                className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-xs sm:text-sm truncate">
                  {productTitle}
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <span>{t.order.form.unitPrice} :</span>
                  <span className="font-mono font-bold text-white">{unitPrice.toLocaleString()} DZD</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{t.order.form.paymentInfo}</span>
                </div>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* The Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.name}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder={t.order.form.namePlaceholder}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.phone}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.order.form.phonePlaceholder}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Wilaya & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.wilaya}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
                    <select
                      required
                      value={formData.wilaya}
                      onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                    >
                      <option value="">{t.order.form.selectWilaya}</option>
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.commune}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    placeholder={t.order.form.communePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Quantity Stepper & Vehicle Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.quantity}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold cursor-pointer"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center font-mono font-black text-white text-sm">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-zinc-400">
                      × {unitPrice.toLocaleString()} DZD
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.vehicleNote}
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
                    <input
                      type="text"
                      value={formData.vehicleNote}
                      onChange={(e) => setFormData({ ...formData, vehicleNote: e.target.value })}
                      placeholder={t.order.form.vehicleNotePlaceholder}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                    {t.order.form.totalPrice}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {t.order.form.paymentInfo}
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {totalPrice.toLocaleString()}{" "}
                  <span className="text-brand-redLight text-base">{t.products.currency}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-brand-red hover:bg-brand-redDark text-white font-black text-sm tracking-wide shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t.order.form.submitting}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t.order.form.submitBtn}</span>
                  </>
                )}
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
