import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import {
  ALGERIA_WILAYAS,
  getCommunesByWilaya,
  isValidAlgerianPhone,
  cleanAlgerianPhone,
  getPrimaryPhone,
  getWhatsAppUrl
} from "../data/algeriaWilayasCommunes";
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
  ShieldCheck,
  Home,
  Building2,
  ShoppingCart
} from "lucide-react";

export function OrderModal({ isOpen, onClose, product = null }) {
  const { t, isRtl } = useLanguage();
  const { data, createOrder, getWilayaDeliveryFee } = useData();

  const settings = data?.settings || {};
  const primaryPhone = getPrimaryPhone(settings);

  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState("home"); // "home" | "desk"
  const [addedToCart, setAddedToCart] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    wilaya: "",
    commune: "",
    vehicleNote: ""
  });

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const availableCommunes = getCommunesByWilaya(formData.wilaya);
  const wilayaFee = getWilayaDeliveryFee ? getWilayaDeliveryFee(formData.wilaya) : { home: 600, desk: 350, active: true };
  const isWilayaActive = wilayaFee?.active !== false;
  const isPhoneValid = isValidAlgerianPhone(formData.phone);
  const isPhoneInvalid = phoneTouched && formData.phone.length > 0 && !isPhoneValid;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setDeliveryType("home");
      setAddedToCart(false);
      setSuccessOrder(null);
      setErrorMsg("");
      setPhoneTouched(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const unitPrice = Number(product.price) || 0;
  const subtotal = unitPrice * quantity;
  const currentDeliveryFee = formData.wilaya && isWilayaActive
    ? (deliveryType === "desk" ? Number(wilayaFee?.desk || 0) : Number(wilayaFee?.home || 0))
    : 0;
  const finalTotal = subtotal + currentDeliveryFee;
  const productTitle = isRtl ? product.nameAr || product.nameFr : product.nameFr;

  const handleWilayaChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      wilaya: val,
      commune: "" // Reset commune when wilaya changes
    }));
  };

  const handleAddToCart = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const existingCart = JSON.parse(localStorage.getItem("autoled_cart") || "[]");
      const existingIndex = existingCart.findIndex(
        (item) => item.productId === product.id && item.deliveryType === deliveryType
      );

      const itemToAdd = {
        id: product.id + "-" + Date.now(),
        productId: product.id,
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        price: unitPrice,
        image: product.image || "/biled-lens.jpg",
        quantity: quantity,
        wilaya: formData.wilaya,
        commune: formData.commune,
        deliveryType: deliveryType,
        deliveryFee: currentDeliveryFee,
        vehicleNote: formData.vehicleNote,
        addedAt: Date.now()
      };

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity += quantity;
        if (formData.wilaya) existingCart[existingIndex].wilaya = formData.wilaya;
        if (formData.commune) existingCart[existingIndex].commune = formData.commune;
      } else {
        existingCart.push(itemToAdd);
      }

      localStorage.setItem("autoled_cart", JSON.stringify(existingCart));
      window.dispatchEvent(new Event("cartUpdated"));

      setAddedToCart(true);
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setPhoneTouched(true);

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.wilaya.trim() || !formData.commune.trim()) {
      setErrorMsg(isRtl ? "يرجى ملء الاسم، رقم الهاتف، ولاية وبلدية التوصيل (*)" : "Veuillez remplir le nom, téléphone, la wilaya et la commune (*)");
      return;
    }

    if (!isValidAlgerianPhone(formData.phone)) {
      setErrorMsg(t.order.form.phoneError);
      return;
    }

    if (!formData.commune.trim()) {
      setErrorMsg(t.order.form.communeRequired);
      return;
    }

    if (formData.wilaya && !isWilayaActive) {
      setErrorMsg(isRtl ? "خدمة التوصيل لهذه الولاية متوقفة مؤقتاً." : "La livraison vers cette wilaya est momentanément suspendue.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanPhone = cleanAlgerianPhone(formData.phone);
      const payload = {
        customerName: formData.customerName.trim(),
        phone: cleanPhone,
        wilaya: formData.wilaya.trim(),
        commune: formData.commune.trim(),
        deliveryType,
        deliveryFee: currentDeliveryFee,
        quantity,
        subtotal,
        total: finalTotal,
        vehicleNote: formData.vehicleNote.trim(),
        productId: product.id,
        productName: product.nameFr,
        productImage: product.image || "/biled-lens.jpg",
        productPrice: unitPrice
      };

      const res = await createOrder(payload);
      if (res && res.success) {
        setSuccessOrder(res.order || { ...payload, id: "cmd-" + Date.now(), total: finalTotal });
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
      phone: cleanAlgerianPhone(formData.phone),
      wilaya: formData.wilaya,
      commune: formData.commune,
      deliveryType,
      deliveryFee: currentDeliveryFee,
      subtotal,
      vehicleNote: formData.vehicleNote,
      total: finalTotal
    };

    const typeStr = (order.deliveryType || deliveryType) === "desk"
      ? (isRtl ? "استلام من مكتب التوصيل (Stop Desk)" : "Au Bureau (Stop Desk)")
      : (isRtl ? "توصيل للمنزل (À Domicile)" : "À Domicile (Maison)");

    const msg = isRtl
      ? `سلام عليكم متجر أوتو ليد البليدة، قمت بتأكيد طلبية شراء عبر الموقع:\n- رقم الطلبية: ${order.id}\n- المنتج: ${productTitle}\n- الكمية: ${quantity}\n- المجموع الفرعي: ${order.subtotal?.toLocaleString() || subtotal.toLocaleString()} د.ج\n- طريقة التوصيل: ${typeStr} (+${(order.deliveryFee ?? currentDeliveryFee).toLocaleString()} د.ج)\n- المجموع الكلي للدفع: ${order.total?.toLocaleString() || finalTotal.toLocaleString()} د.ج\n- الاسم: ${order.customerName}\n- الهاتف: ${order.phone}\n- ولاية التوصيل: ${order.wilaya}\n- بلدية التوصيل: ${order.commune}\n${order.vehicleNote ? `- نوع السيارة: ${order.vehicleNote}\n` : ""}يرجى تأكيد إرسال الطرد مع شركة التوصيل. شكراً.`
      : `Bonjour AutoLedBlida, j'ai passé commande sur votre site:\n- Réf Commande: ${order.id}\n- Produit: ${product.nameFr}\n- Quantité: ${quantity}\n- Sous-total: ${order.subtotal?.toLocaleString() || subtotal.toLocaleString()} DZD\n- Mode de livraison: ${typeStr} (+${(order.deliveryFee ?? currentDeliveryFee).toLocaleString()} DZD)\n- Total à payer: ${order.total?.toLocaleString() || finalTotal.toLocaleString()} DZD\n- Nom: ${order.customerName}\n- Téléphone: ${order.phone}\n- Wilaya de livraison: ${order.wilaya}\n- Commune de livraison: ${order.commune}\n${order.vehicleNote ? `- Véhicule: ${order.vehicleNote}\n` : ""}Merci de confirmer l'expédition avec le livreur.`;

    return getWhatsAppUrl(primaryPhone, msg);
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
                  {(successOrder.total || finalTotal).toLocaleString()} DZD
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
                <div>
                  <span className="text-zinc-500 block">Mode de livraison :</span>
                  <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                    {successOrder.deliveryType === "desk" ? (
                      <>
                        <Building2 className="w-3 h-3 text-sky-400" />
                        <span>Bureau / Agence ({successOrder.deliveryFee || currentDeliveryFee} DZD)</span>
                      </>
                    ) : (
                      <>
                        <Home className="w-3 h-3 text-emerald-400" />
                        <span>À Domicile ({successOrder.deliveryFee || currentDeliveryFee} DZD)</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Destination :</span>
                  <span className="text-white font-semibold truncate block mt-0.5">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-300 block">
                      {t.order.form.phone}
                    </label>
                    {isPhoneValid && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{isRtl ? "رقم صحيح" : "Numéro valide"}</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 transition-colors ${
                      isPhoneValid ? "text-emerald-400" : isPhoneInvalid ? "text-rose-400" : "text-zinc-400"
                    }`} />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="05 / 06 / 07..."
                      maxLength={14}
                      className={`w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border text-white placeholder-zinc-500 focus:outline-none font-mono transition-all ${
                        isPhoneValid
                          ? "border-emerald-500/80 focus:border-emerald-500"
                          : isPhoneInvalid
                          ? "border-rose-500 focus:border-rose-500 bg-rose-950/20"
                          : "border-zinc-700 focus:border-brand-red"
                      }`}
                    />
                  </div>
                  {isPhoneInvalid && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-start gap-1 font-medium leading-tight">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{t.order.form.phoneError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Wilaya & Commune Dropdowns */}
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
                      onChange={handleWilayaChange}
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
                  <div className="relative">
                    <MapPin className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none ${
                      !formData.wilaya ? "text-zinc-600" : "text-zinc-400"
                    }`} />
                    <select
                      required
                      disabled={!formData.wilaya}
                      value={formData.commune}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      className={`w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border text-white focus:outline-none focus:border-brand-red transition-all ${
                        !formData.wilaya ? "opacity-50 cursor-not-allowed border-zinc-800 text-zinc-500" : "border-zinc-700"
                      }`}
                    >
                      <option value="">
                        {!formData.wilaya ? t.order.form.selectWilayaFirst : t.order.form.selectCommune}
                      </option>
                      {availableCommunes.map((comm) => (
                        <option key={comm} value={comm}>
                          {comm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Delivery Mode: Domicile (Maison) vs Bureau (Stop Desk) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-zinc-300">
                    {t.order.form.deliveryMode || (isRtl ? "طريقة التوصيل والاستلام *" : "Mode de livraison *")}
                  </label>
                  {formData.wilaya && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {formData.wilaya.split(" - ")[1] || formData.wilaya}
                    </span>
                  )}
                </div>

                {!isWilayaActive && formData.wilaya ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{isRtl ? "خدمة التوصيل لهذه الولاية متوقفة مؤقتاً." : "La livraison vers cette wilaya est momentanément suspendue."}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Home / Maison Option */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      className={`p-3 rounded-2xl border text-start transition-all flex items-center justify-between cursor-pointer ${
                        deliveryType === "home"
                          ? "bg-brand-red/15 border-brand-red text-white shadow-glow-red/20"
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          deliveryType === "home" ? "bg-brand-red text-white" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          <Home className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate text-white">
                            {t.order.form.deliveryHome || (isRtl ? "توصيل للمنزل" : "À Domicile")}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isRtl ? "توصيل للباب (Maison)" : "Livraison directe à domicile"}
                          </div>
                        </div>
                      </div>
                      <div className="text-end shrink-0 pl-2 rtl:pl-0 rtl:pr-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                          {formData.wilaya ? `${wilayaFee.home.toLocaleString()} DZD` : "-- DZD"}
                        </span>
                      </div>
                    </button>

                    {/* Desk / Bureau Option */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType("desk")}
                      className={`p-3 rounded-2xl border text-start transition-all flex items-center justify-between cursor-pointer ${
                        deliveryType === "desk"
                          ? "bg-brand-red/15 border-brand-red text-white shadow-glow-red/20"
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          deliveryType === "desk" ? "bg-brand-red text-white" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate text-white">
                            {t.order.form.deliveryDesk || (isRtl ? "مكتب التوصيل" : "Au Bureau")}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isRtl ? "استلام بالوكالة (Stop Desk)" : "Récupération Stop Desk"}
                          </div>
                        </div>
                      </div>
                      <div className="text-end shrink-0 pl-2 rtl:pl-0 rtl:pr-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-sky-400">
                          {formData.wilaya ? `${wilayaFee.desk.toLocaleString()} DZD` : "-- DZD"}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
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
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{t.order.form.subtotal || (isRtl ? "المجموع الفرعي" : "Sous-total articles")} ({quantity} × {unitPrice.toLocaleString()} DZD)</span>
                  <span className="font-mono font-bold text-zinc-200">{subtotal.toLocaleString()} DZD</span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {t.order.form.deliveryFee || (isRtl ? "تكلفة التوصيل" : "Frais de livraison")} (
                      {deliveryType === "desk" ? (isRtl ? "مكتب" : "Bureau") : (isRtl ? "منزل" : "Maison")}
                      {formData.wilaya ? ` - ${formData.wilaya.split(" - ")[1] || formData.wilaya}` : ""}
                      )
                    </span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formData.wilaya ? `+${currentDeliveryFee.toLocaleString()} DZD` : (isRtl ? "اختر الولاية أولاً" : "Sélectionnez wilaya")}
                  </span>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                      {t.order.form.totalToPay || t.order.form.totalPrice}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {t.order.form.paymentInfo}
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {finalTotal.toLocaleString()}{" "}
                    <span className="text-brand-redLight text-base">{t.products.currency}</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full py-3.5 rounded-2xl border font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
                  addedToCart
                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-100 hover:text-white active:scale-[0.99]"
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <span>{t.order.form.addedToCart || (isRtl ? "تمت الإضافة إلى السلة بنجاح !" : "Produit ajouté au panier !")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                    <span>{t.order.form.addToCart || (isRtl ? "إضافة إلى السلة" : "Ajouter au panier")}</span>
                  </>
                )}
              </button>

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
