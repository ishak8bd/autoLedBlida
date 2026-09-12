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
  Home,
  Building2,
  Trash2,
  Package
} from "lucide-react";

export function OrderModal({ isOpen, onClose, product = null }) {
  const { t, isRtl } = useLanguage();
  const { data, createOrder, getWilayaDeliveryFee } = useData();

  const settings = data?.settings || {};
  const primaryPhone = getPrimaryPhone(settings);

  // Multi-product order items state: Array of { id, nameFr, nameAr, price, image, quantity }
  const [orderItems, setOrderItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState("home"); // "home" | "desk"
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

  // Helper to persist draft
  const saveDraft = (itemsToSave, formToSave, delTypeToSave) => {
    try {
      const draft = {
        items: itemsToSave,
        formData: formToSave,
        deliveryType: delTypeToSave,
        updatedAt: Date.now()
      };
      localStorage.setItem("autoled_order_draft", JSON.stringify(draft));
      window.dispatchEvent(new Event("orderDraftUpdated"));
    } catch (e) {
      console.warn("Failed to save order draft:", e);
    }
  };

  // Load / initialize order when modal opens or product changes
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg("");
    setPhoneTouched(false);
    setSuccessOrder(null);

    let savedDraft = null;
    try {
      const raw = localStorage.getItem("autoled_order_draft");
      if (raw) savedDraft = JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read order draft", e);
    }

    let initialForm = {
      customerName: "",
      phone: "",
      wilaya: "",
      commune: "",
      vehicleNote: ""
    };
    let initialDeliveryType = "home";
    let initialItems = [];

    if (savedDraft) {
      if (savedDraft.formData) {
        initialForm = {
          customerName: savedDraft.formData.customerName || "",
          phone: savedDraft.formData.phone || "",
          wilaya: savedDraft.formData.wilaya || "",
          commune: savedDraft.formData.commune || "",
          vehicleNote: savedDraft.formData.vehicleNote || ""
        };
      }
      if (savedDraft.deliveryType) {
        initialDeliveryType = savedDraft.deliveryType;
      }
      if (Array.isArray(savedDraft.items) && savedDraft.items.length > 0) {
        initialItems = [...savedDraft.items];
      }
    }

    // If opened with a specific product
    if (product) {
      const existingIdx = initialItems.findIndex((it) => it.id === product.id);
      if (existingIdx > -1) {
        // Product already in order; ensure at least quantity 1
        if (!initialItems[existingIdx].quantity || initialItems[existingIdx].quantity < 1) {
          initialItems[existingIdx].quantity = 1;
        }
      } else {
        // Append new product to the order items
        initialItems.push({
          id: product.id,
          nameFr: product.nameFr,
          nameAr: product.nameAr || product.nameFr,
          price: Number(product.price) || 0,
          image: product.image || "/biled-lens.jpg",
          quantity: 1
        });
      }
    }

    setFormData(initialForm);
    setDeliveryType(initialDeliveryType);
    setOrderItems(initialItems);

    // Save synchronized draft
    saveDraft(initialItems, initialForm, initialDeliveryType);
  }, [isOpen, product]);

  if (!isOpen) return null;
  if (orderItems.length === 0 && !product && !successOrder) return null;

  // Calculation values
  const availableCommunes = getCommunesByWilaya(formData.wilaya);
  const wilayaFee = getWilayaDeliveryFee ? getWilayaDeliveryFee(formData.wilaya) : { home: 600, desk: 350, active: true };
  const isWilayaActive = wilayaFee?.active !== false;
  const isPhoneValid = isValidAlgerianPhone(formData.phone);
  const isPhoneInvalid = phoneTouched && formData.phone.length > 0 && !isPhoneValid;

  const totalItemsCount = orderItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = orderItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0);

  // Delivery fee is applied EXACTLY ONCE for the entire package/order
  const currentDeliveryFee = formData.wilaya && isWilayaActive
    ? (deliveryType === "desk" ? Number(wilayaFee?.desk || 0) : Number(wilayaFee?.home || 0))
    : 0;
  const finalTotal = subtotal + currentDeliveryFee;

  // Handle Form changes
  const handleFormChange = (key, val) => {
    const updatedForm = { ...formData, [key]: val };
    if (key === "wilaya") {
      updatedForm.commune = ""; // Reset commune when wilaya changes
    }
    setFormData(updatedForm);
    saveDraft(orderItems, updatedForm, deliveryType);
  };

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    saveDraft(orderItems, formData, type);
  };

  // Quantity stepper
  const handleUpdateQuantity = (itemId, newQty) => {
    if (newQty < 1) return;
    const updated = orderItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQty } : item
    );
    setOrderItems(updated);
    saveDraft(updated, formData, deliveryType);
  };

  // Remove an item from the order
  const handleRemoveItem = (itemId) => {
    const updated = orderItems.filter((item) => item.id !== itemId);
    setOrderItems(updated);
    saveDraft(updated, formData, deliveryType);
    if (updated.length === 0) {
      onClose();
    }
  };

  // "Ajouter un autre produit" button handler
  const handleAddAnotherProduct = () => {
    // 1. Save draft so information & products are fully preserved
    saveDraft(orderItems, formData, deliveryType);
    // 2. Close modal smoothly
    onClose();
    // 3. Smoothly scroll back to the products catalog
    setTimeout(() => {
      const catalogEl = document.getElementById("produits");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 120);
  };

  // Submit Order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setPhoneTouched(true);

    if (orderItems.length === 0) {
      setErrorMsg(isRtl ? "سلة الطلب فارغة، يرجى اختيار منتج" : "Aucun produit dans la commande.");
      return;
    }

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.wilaya.trim() || !formData.commune.trim()) {
      setErrorMsg(
        isRtl
          ? "يرجى ملء الاسم، رقم الهاتف، ولاية وبلدية التوصيل (*)"
          : "Veuillez remplir le nom, téléphone, la wilaya et la commune (*)"
      );
      return;
    }

    if (!isValidAlgerianPhone(formData.phone)) {
      setErrorMsg(t.order.form.phoneError);
      return;
    }

    if (formData.wilaya && !isWilayaActive) {
      setErrorMsg(
        isRtl
          ? "خدمة التوصيل لهذه الولاية متوقفة مؤقتاً."
          : "La livraison vers cette wilaya est momentanément suspendue."
      );
      return;
    }

    setSubmitting(true);
    try {
      const cleanPhone = cleanAlgerianPhone(formData.phone);
      const itemsPayload = orderItems.map((it) => ({
        productId: it.id,
        productName: it.nameFr,
        productPrice: it.price,
        productImage: it.image,
        quantity: it.quantity
      }));

      const displayTitle = orderItems.length === 1
        ? orderItems[0].nameFr
        : `${orderItems.length} articles (${orderItems.map((i) => `${i.nameFr} x${i.quantity}`).join(", ")})`;

      const payload = {
        customerName: formData.customerName.trim(),
        phone: cleanPhone,
        wilaya: formData.wilaya.trim(),
        commune: formData.commune.trim(),
        deliveryType,
        deliveryFee: currentDeliveryFee,
        quantity: totalItemsCount,
        subtotal,
        total: finalTotal,
        vehicleNote: formData.vehicleNote.trim(),
        items: itemsPayload,
        productId: orderItems[0]?.id || "",
        productName: displayTitle,
        productImage: orderItems[0]?.image || "/biled-lens.jpg",
        productPrice: orderItems[0]?.price || 0
      };

      const res = await createOrder(payload);
      if (res && res.success) {
        setSuccessOrder(res.order || { ...payload, id: "cmd-" + Date.now(), total: finalTotal });
        // Order completed successfully: clear draft from storage
        localStorage.removeItem("autoled_order_draft");
        window.dispatchEvent(new Event("orderDraftUpdated"));
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

  // WhatsApp Order Confirmation Message Generator
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
      total: finalTotal,
      items: orderItems
    };

    const typeStr = (order.deliveryType || deliveryType) === "desk"
      ? (isRtl ? "استلام من مكتب التوصيل (Stop Desk)" : "Au Bureau (Stop Desk)")
      : (isRtl ? "توصيل للمنزل (À Domicile)" : "À Domicile (Maison)");

    const itemsListStr = (order.items && order.items.length > 0 ? order.items : orderItems)
      .map((it) => `  • ${it.nameFr || it.productName} (x${it.quantity}) : ${((Number(it.price || it.productPrice) || 0) * (it.quantity || 1)).toLocaleString()} DZD`)
      .join("\n");

    const msg = isRtl
      ? `سلام عليكم متجر أوتو ليد البليدة، قمت بتأكيد طلبية شراء عبر الموقع:\n- رقم الطلبية: ${order.id}\n- المنتجات المطلوبة (${order.quantity || totalItemsCount} قطع):\n${itemsListStr}\n- المجموع الفرعي: ${(order.subtotal || subtotal).toLocaleString()} د.ج\n- طريقة التوصيل: ${typeStr} (+${(order.deliveryFee ?? currentDeliveryFee).toLocaleString()} د.ج - تكلفة موحدة)\n- المجموع الكلي للدفع: ${(order.total || finalTotal).toLocaleString()} د.ج\n- الاسم: ${order.customerName}\n- الهاتف: ${order.phone}\n- ولاية التوصيل: ${order.wilaya}\n- بلدية التوصيل: ${order.commune}\n${order.vehicleNote ? `- نوع السيارة: ${order.vehicleNote}\n` : ""}يرجى تأكيد إرسال الطرد مع شركة التوصيل. شكراً.`
      : `Bonjour AutoLedBlida, j'ai passé commande sur votre site:\n- Réf Commande: ${order.id}\n- Articles commandés (${order.quantity || totalItemsCount} pièces):\n${itemsListStr}\n- Sous-total articles: ${(order.subtotal || subtotal).toLocaleString()} DZD\n- Mode de livraison: ${typeStr} (+${(order.deliveryFee ?? currentDeliveryFee).toLocaleString()} DZD - frais uniques)\n- Total à payer: ${(order.total || finalTotal).toLocaleString()} DZD\n- Nom: ${order.customerName}\n- Téléphone: ${order.phone}\n- Wilaya de livraison: ${order.wilaya}\n- Commune de livraison: ${order.commune}\n${order.vehicleNote ? `- Véhicule: ${order.vehicleNote}\n` : ""}Merci de confirmer l'expédition avec le livreur.`;

    return getWhatsAppUrl(primaryPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-6 sm:my-8 rounded-3xl glass-panel border border-zinc-700 bg-brand-surface shadow-2xl p-5 sm:p-7 text-start max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* State A: Success Confirmation Modal */}
        {successOrder ? (
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-red">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
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
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-start space-y-3 text-xs">
              <div className="font-bold text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between">
                <span>{t.order.form.orderItems || (isRtl ? "المنتجات المطلوبة" : "Articles commandés")}</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {(successOrder.total || finalTotal).toLocaleString()} DZD
                </span>
              </div>

              {/* Items List in Recap */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(successOrder.items && successOrder.items.length > 0 ? successOrder.items : orderItems).map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 py-1 text-xs">
                    <img
                      src={it.image || it.productImage || "/biled-lens.jpg"}
                      alt={it.nameFr || it.productName}
                      className="w-9 h-9 rounded-lg object-cover border border-zinc-800 bg-zinc-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate text-xs">
                        {it.nameFr || it.productName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {it.quantity} × {Number(it.price || it.productPrice || 0).toLocaleString()} DZD
                      </div>
                    </div>
                    <div className="font-mono font-bold text-zinc-200 text-xs">
                      {((Number(it.price || it.productPrice) || 0) * (it.quantity || 1)).toLocaleString()} DZD
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px] pt-2 border-t border-zinc-800/80">
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
                        <span>Bureau ({successOrder.deliveryFee || currentDeliveryFee} DZD)</span>
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
            <div className="space-y-2.5 pt-1">
              <a
                href={getConfirmationWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t.order.successModal.whatsappBtn}</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-800 transition-colors cursor-pointer"
              >
                {t.order.successModal.closeBtn}
              </button>
            </div>
          </div>
        ) : (
          /* State B: Order Input Form */
          <div className="space-y-4 sm:space-y-5">
            
            {/* Modal Header */}
            <div className="space-y-1 border-b border-zinc-800/80 pb-3.5">
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

            {/* Multi-Item Order Products List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-red" />
                  <span>
                    {t.order.form.orderItems || (isRtl ? "المنتجات في طلبيتك" : "Articles dans votre commande")} ({orderItems.length})
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {totalItemsCount} {totalItemsCount > 1 ? (isRtl ? "قطع" : "articles") : (isRtl ? "قطعة" : "article")}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {orderItems.map((item) => {
                  const itemTitle = isRtl ? item.nameAr || item.nameFr : item.nameFr;
                  const itemTotal = (Number(item.price) || 0) * (item.quantity || 1);

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3 transition-all hover:border-zinc-700"
                    >
                      <img
                        src={item.image || "/biled-lens.jpg"}
                        alt={itemTitle}
                        className="w-14 h-14 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {itemTitle}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {item.price.toLocaleString()} DZD / unité
                        </div>
                        <div className="font-mono font-bold text-brand-redLight text-xs mt-0.5">
                          = {itemTotal.toLocaleString()} DZD
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Diminuer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-black text-white text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold cursor-pointer"
                            aria-label="Augmenter"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item button if more than 1 item */}
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={isRtl ? "حذف المنتج" : "Supprimer cet article"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error banner if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Customer Information Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      onChange={(e) => handleFormChange("customerName", e.target.value)}
                      placeholder={t.order.form.namePlaceholder}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-xs sm:text-sm"
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
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="05 / 06 / 07..."
                      maxLength={14}
                      className={`w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border text-white placeholder-zinc-500 focus:outline-none font-mono text-xs sm:text-sm transition-all ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.order.form.wilaya}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
                    <select
                      required
                      value={formData.wilaya}
                      onChange={(e) => handleFormChange("wilaya", e.target.value)}
                      className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red text-xs sm:text-sm"
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
                      onChange={(e) => handleFormChange("commune", e.target.value)}
                      className={`w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border text-white focus:outline-none focus:border-brand-red text-xs sm:text-sm transition-all ${
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30">
                      {t.order.form.singleDeliveryNote || (isRtl ? "تكلفة موحدة لكامل الطرد" : "Frais uniques pour tout le colis")}
                    </span>
                    {formData.wilaya && (
                      <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                        {formData.wilaya.split(" - ")[1] || formData.wilaya}
                      </span>
                    )}
                  </div>
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
                      onClick={() => handleDeliveryTypeChange("home")}
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
                      onClick={() => handleDeliveryTypeChange("desk")}
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

              {/* Vehicle Note */}
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  {t.order.form.vehicleNote}
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    value={formData.vehicleNote}
                    onChange={(e) => handleFormChange("vehicleNote", e.target.value)}
                    placeholder={t.order.form.vehicleNotePlaceholder}
                    className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-xs"
                  />
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {t.order.form.subtotal || (isRtl ? "المجموع الفرعي" : "Sous-total articles")} ({totalItemsCount} {totalItemsCount > 1 ? (isRtl ? "قطع" : "articles") : (isRtl ? "قطعة" : "article")})
                  </span>
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
                  <div className="text-end">
                    <span className="font-mono font-bold text-emerald-400">
                      {formData.wilaya ? `+${currentDeliveryFee.toLocaleString()} DZD` : (isRtl ? "اختر الولاية أولاً" : "Sélectionnez wilaya")}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      ({t.order.form.singleDeliveryNote || (isRtl ? "تكلفة موحدة" : "frais uniques")})
                    </span>
                  </div>
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

              {/* Action 1: Ajouter un autre produit (takes customer back to catalog, keeps info) */}
              <button
                type="button"
                onClick={handleAddAnotherProduct}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-brand-red/60 text-zinc-100 hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-[0.99] group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-red/20 group-hover:bg-brand-red text-brand-red group-hover:text-white flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>{t.order.form.addAnotherProduct || (isRtl ? "إضافة منتج آخر" : "Ajouter un autre produit")}</span>
              </button>

              {/* Action 2: Confirmer la commande Submit */}
              <button
                type="submit"
                disabled={submitting || orderItems.length === 0}
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

