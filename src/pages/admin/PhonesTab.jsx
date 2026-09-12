import React, { useState } from "react";
import { Phone, Plus, Edit, Trash2, XCircle, Check, Star } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function PhonesTab() {
  const { t, isRtl } = useLanguage();
  const { data, savePhone, deletePhone } = useData();

  const [editingPhone, setEditingPhone] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const settings = data?.settings || {};
  const phoneNumbers = settings.phoneNumbers || [];

  return (
    <div className="space-y-6 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">{t.admin.phonesTab.title}</h3>
          <p className="text-xs text-zinc-400">{t.admin.phonesTab.subtitle}</p>
        </div>

        <button
          onClick={() => {
            setEditingPhone({
              number: "",
              labelFr: "Service Client",
              labelAr: "خدمة العملاء",
              isPrimary: false,
              whatsapp: true
            });
            setShowPhoneModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.phonesTab.addBtn}</span>
        </button>
      </div>

      {/* Info notice explaining primary phone & WhatsApp connection */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <Star className="w-4 h-4 text-amber-400 fill-current shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-white text-xs">
            {isRtl ? "الرقم الرئيسي هو رقم الواتساب المعتمد في كل الموقع" : "Le Numéro Principal alimente tous les boutons WhatsApp du site"}
          </span>
          <span className="text-zinc-300 text-[11px] block mt-0.5">
            {isRtl
              ? "جميع أزرار الواتساب (الهيدر، الشريط السفلي للموبايل، طلب المنتجات، وتأكيد الحجز) تفتح محادثة واتساب مع الرقم المحدد كـ 'رئيسي'."
              : "Tous les boutons WhatsApp (En-tête, Barre Mobile, Commande Produit, Prise de Rendez-vous, et Pied de page) ouvrent directement le WhatsApp du numéro désigné comme 'Principal'."}
          </span>
        </div>
      </div>

      {/* Phones List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phoneNumbers.map((phone) => (
          <div
            key={phone.id || phone.number}
            className={`p-5 rounded-2xl glass-panel border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              phone.isPrimary
                ? "border-amber-400/50 bg-amber-500/5 shadow-sm"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-black text-white">
                  {phone.number}
                </span>
                {phone.isPrimary ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    <span>{isRtl ? "الرئيسي (واتساب نشط)" : "Principal (WhatsApp Actif)"}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => savePhone({ ...phone, isPrimary: true, whatsapp: true })}
                    className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-amber-400/20 text-zinc-400 hover:text-amber-300 border border-zinc-700 hover:border-amber-400/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title={isRtl ? "تعيين كرقم رئيسي للواتساب" : "Définir comme numéro principal WhatsApp"}
                  >
                    <Star className="w-3 h-3" />
                    <span>{isRtl ? "تعيين كرئيسي" : "Définir Principal"}</span>
                  </button>
                )}
                {phone.whatsapp && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    WhatsApp
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400">
                {phone.labelFr} / {phone.labelAr}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  setEditingPhone({ ...phone });
                  setShowPhoneModal(true);
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Supprimer ce numéro ?")) {
                    deletePhone(phone.id);
                  }
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Phone Add/Edit Modal */}
      {showPhoneModal && editingPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-brand-surface border border-zinc-700 p-6 sm:p-8 space-y-5 text-start">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-white">
                {editingPhone.id ? "Modifier le numéro" : "Nouveau Numéro de Téléphone"}
              </h4>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  {t.admin.phonesTab.form.number}
                </label>
                <input
                  type="text"
                  value={editingPhone.number}
                  onChange={(e) => setEditingPhone({ ...editingPhone, number: e.target.value })}
                  placeholder="0561147039"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  {t.admin.phonesTab.form.labelFr}
                </label>
                <input
                  type="text"
                  value={editingPhone.labelFr}
                  onChange={(e) => setEditingPhone({ ...editingPhone, labelFr: e.target.value })}
                  placeholder="ex. Service Client"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  {t.admin.phonesTab.form.labelAr}
                </label>
                <input
                  type="text"
                  value={editingPhone.labelAr}
                  onChange={(e) => setEditingPhone({ ...editingPhone, labelAr: e.target.value })}
                  placeholder="مثال: خدمة الزبائن"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPhone.isPrimary}
                    onChange={(e) => setEditingPhone({ ...editingPhone, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-red bg-zinc-900 border-zinc-700"
                  />
                  <span>{t.admin.phonesTab.form.isPrimary}</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPhone.whatsapp}
                    onChange={(e) => setEditingPhone({ ...editingPhone, whatsapp: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-red bg-zinc-900 border-zinc-700"
                  />
                  <span>{t.admin.phonesTab.form.whatsapp}</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                {t.admin.phonesTab.form.cancelBtn}
              </button>
              <button
                onClick={async () => {
                  await savePhone(editingPhone);
                  setShowPhoneModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {t.admin.phonesTab.form.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}