import React, { useState } from "react";
import { Plus, Edit, Trash2, XCircle, Upload, Image as ImageIcon, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

const PRESET_GALLERY = [
  { url: "/biled-lens.jpg", label: "Projecteur Bi-LED" },
  { url: "/led-bulb.jpg", label: "Ampoule LED GPNE" },
  { url: "/xenon-kit.jpg", label: "Kit Xénon 55W" },
  { url: "/angel-eyes.jpg", label: "Angel Eyes Halo" },
  { url: "/aozoom-beam-wall.jpg", label: "Faisceau AOZOOM" },
  { url: "/fluence-retrofit.jpg", label: "Fluence Angel Eyes" },
  { url: "/crystal-headlight.jpg", label: "Optique Cristalline" },
  { url: "/bmw-hero.jpg", label: "BMW Atelier" }
];

export function ProductsTab() {
  const { t, isRtl } = useLanguage();
  const { data, saveProduct, deleteProduct, uploadImage } = useData();

  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const products = data?.products || [];
  const categories = data?.categories || [];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setEditingProduct((prev) => ({ ...prev, image: url }));
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Échec du téléversement de l'image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{t.admin.productsTab.title}</h3>
          <p className="text-xs text-zinc-400">
            {isRtl ? "إضافة وتعديل وحذف المنتجات مع رفع الصور أو كتابة الروابط" : "Gestion du catalogue, téléversement de photos et stock"}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct({
              nameFr: "",
              nameAr: "",
              price: 8500,
              category: categories[0]?.id || "led-bulbs",
              inStock: true,
              badgeFr: "Nouveau",
              badgeAr: "جديد",
              image: "/biled-lens.jpg",
              descriptionFr: "",
              descriptionAr: ""
            });
            setShowProductModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.productsTab.addBtn}</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3.5 px-4 text-start">{t.admin.productsTab.colProduct}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.productsTab.colCategory}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.productsTab.colPrice}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.productsTab.colStock}</th>
                <th className="p-3.5 px-4 text-end">{t.admin.productsTab.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || "/biled-lens.jpg"}
                        alt={p.nameFr}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white line-clamp-1">{p.nameFr}</div>
                        <div className="text-xs text-zinc-400 line-clamp-1">{p.nameAr}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 px-4 font-medium text-zinc-300">
                    {p.category}
                  </td>
                  <td className="p-3.5 px-4 font-mono font-black text-white">
                    {p.price?.toLocaleString()} DZD
                  </td>
                  <td className="p-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.inStock
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-950 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {p.inStock ? t.admin.productsTab.inStock : t.admin.productsTab.outOfStock}
                    </span>
                  </td>
                  <td className="p-3.5 px-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct({ ...p });
                          setShowProductModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Supprimer ce produit ?")) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Modal with File Upload & Gallery & URL Input */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-brand-surface border border-zinc-700 p-6 sm:p-8 space-y-5 text-start my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h4 className="text-xl font-bold text-white">
                {editingProduct.id ? t.admin.productsTab.editTitle : t.admin.productsTab.addTitle}
              </h4>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              
              {/* Product Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.nameFr}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameFr}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameFr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.nameAr}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameAr}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.price}
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.category}
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-brand-red"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.nameAr : c.nameFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* --- IMAGE UPLOAD & SELECTION SECTION --- */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-red" />
                    {isRtl ? "صورة المنتج (رفع أو كتابة الرابط أو الاختيار)" : "Photo du produit (Téléverser, Lien ou Sélection)"}
                  </span>
                  {uploading && (
                    <span className="text-[11px] text-amber-400 font-bold animate-pulse">
                      Téléversement en cours...
                    </span>
                  )}
                </div>

                {/* Option A: Direct Device File Upload */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-600 hover:border-brand-red text-white text-xs font-bold transition-all w-full sm:w-auto">
                    <Upload className="w-4 h-4 text-brand-redLight" />
                    <span>{isRtl ? "رفع صورة من هاتفك أو جهازك" : "Téléverser depuis appareil (PC/Téléphone)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Option B: Manual URL or filename */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    {isRtl ? "أو اكتب رابط الصورة أو اسمها المباشر (Lien ou nom) :" : "Ou écrivez le lien / nom de l'image (ex. /biled-lens.jpg ou https://...) :"}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    placeholder="/biled-lens.jpg, /led-bulb.jpg, /xenon-kit.jpg..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
                  />
                </div>

                {/* Option C: Preset Workshop Gallery */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    {isRtl ? "أو اختر صورة جاهزة من صور الورشة بنقرة واحدة :" : "Ou choisissez parmi les photos de l'atelier :"}
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_GALLERY.map((item) => (
                      <button
                        key={item.url}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image: item.url })}
                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                          editingProduct.image === item.url
                            ? "border-brand-red ring-2 ring-brand-red scale-105"
                            : "border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100"
                        }`}
                        title={item.label}
                      >
                        <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        {editingProduct.image === item.url && (
                          <div className="absolute inset-0 bg-brand-red/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview of Selected Image */}
                {editingProduct.image && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={editingProduct.image}
                      alt="Aperçu"
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shadow-sm"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aperçu de la photo sélectionnée</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                        {editingProduct.image}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    Badge FR (ex. Best-Seller)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badgeFr || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badgeFr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    Badge AR (ex. الأكثر طلباً)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badgeAr || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badgeAr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editingProduct.inStock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-red bg-zinc-900 border-zinc-700"
                />
                <label htmlFor="inStockCheck" className="text-zinc-200 font-semibold cursor-pointer">
                  {t.admin.productsTab.form.inStock}
                </label>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.descFr}
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.descriptionFr || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, descriptionFr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.descAr}
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.descriptionAr || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold"
              >
                {t.admin.productsTab.form.cancelBtn}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveProduct(editingProduct);
                  setShowProductModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red"
              >
                {t.admin.productsTab.form.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}