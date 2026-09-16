import React, { useState } from "react";
import { Plus, Edit, Trash2, XCircle, Upload, Image as ImageIcon, Check, Star, Camera, Search } from "lucide-react";
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
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"

  const products = data?.products || [];
  const categories = data?.categories || [];

  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadImage(file);
        if (url) newUrls.push(url);
      }

      setEditingProduct((prev) => {
        const existingImages = Array.isArray(prev.images) && prev.images.length > 0
          ? prev.images
          : (prev.image ? [prev.image] : []);
        const combined = [...existingImages, ...newUrls];
        return {
          ...prev,
          images: combined,
          image: prev.image || combined[0] || ""
        };
      });
    } catch (err) {
      console.error("Failed to upload images:", err);
      alert("Échec du téléversement de l'image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;

    setEditingProduct((prev) => {
      const existingImages = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);
      const combined = [...existingImages, trimmed];
      return {
        ...prev,
        images: combined,
        image: prev.image || trimmed
      };
    });
    setCustomUrlInput("");
  };

  const handleAddPreset = (url) => {
    setEditingProduct((prev) => {
      const existingImages = Array.isArray(prev.images) && prev.images.length > 0
        ? prev.images
        : (prev.image ? [prev.image] : []);

      if (!existingImages.includes(url)) {
        const combined = [...existingImages, url];
        return {
          ...prev,
          images: combined,
          image: prev.image || url
        };
      } else {
        return {
          ...prev,
          image: url
        };
      }
    });
  };

  const handleSetMainImage = (url) => {
    setEditingProduct((prev) => ({
      ...prev,
      image: url
    }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setEditingProduct((prev) => {
      const currentList = Array.isArray(prev.images) ? [...prev.images] : (prev.image ? [prev.image] : []);
      const removedUrl = currentList[indexToRemove];
      const updatedList = currentList.filter((_, idx) => idx !== indexToRemove);

      let newMain = prev.image;
      if (newMain === removedUrl) {
        newMain = updatedList.length > 0 ? updatedList[0] : "";
      }

      return {
        ...prev,
        images: updatedList,
        image: newMain
      };
    });
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return catId;
    return isRtl ? cat.nameAr || cat.nameFr : cat.nameFr || cat.nameAr;
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    const q = (productSearch || "").trim().toLowerCase();
    const matchesQuery =
      !q ||
      (p.nameFr || "").toLowerCase().includes(q) ||
      (p.nameAr || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.descriptionFr || "").toLowerCase().includes(q) ||
      (p.descriptionAr || "").toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 text-start">
      {/* Top Header: Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
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
              images: ["/biled-lens.jpg"],
              descriptionFr: "",
              descriptionAr: ""
            });
            setShowProductModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.productsTab.addBtn}</span>
        </button>
      </div>

      {/* Toolbar: Search, Category Filter & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={t.admin.productsTab.search || "Rechercher un produit..."}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
            />
          </div>

          {/* Category dropdown */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-brand-red shrink-0 max-w-[150px] sm:max-w-none"
          >
            <option value="all">{t.admin.productsTab.allCategories || "Toutes catégories"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {isRtl ? c.nameAr : c.nameFr}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-brand-red text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.admin.productsTab.viewTable || "Tableau"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "cards"
                ? "bg-brand-red text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.admin.productsTab.viewCards || "Cartes"}
          </button>
        </div>
      </div>

      {/* PRODUCTS DISPLAY: Responsive Table or Responsive Cards */}
      {viewMode === "table" ? (
        <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
          {/* Mobile swipe hint */}
          <div className="block md:hidden text-[11px] text-zinc-400 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-center font-medium">
            {t.admin.productsTab.scrollHint || (isRtl ? "مرر أفقياً لعرض كامل الجدول ↔" : "Glissez horizontalement pour voir tout le tableau ↔")}
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-start text-xs sm:text-sm min-w-max">
              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[11px] font-bold">
                <tr>
                  <th className="p-3.5 px-4 text-start whitespace-nowrap">{t.admin.productsTab.colProduct}</th>
                  <th className="p-3.5 px-4 text-start whitespace-nowrap">{t.admin.productsTab.colCategory}</th>
                  <th className="p-3.5 px-4 text-start whitespace-nowrap">{t.admin.productsTab.colPrice}</th>
                  <th className="p-3.5 px-4 text-start whitespace-nowrap">{t.admin.productsTab.colStock}</th>
                  <th className="p-3.5 px-4 text-end whitespace-nowrap">{t.admin.productsTab.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-zinc-500">
                      {t.admin.productsTab.noData || "Aucun produit trouvé."}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const imgCount = Array.isArray(p.images) && p.images.length > 0 ? p.images.length : (p.image ? 1 : 0);
                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={p.image || "/biled-lens.jpg"}
                                alt={p.nameFr}
                                className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                              />
                              {imgCount > 1 && (
                                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-brand-red text-[10px] font-bold text-white shadow-md flex items-center gap-0.5">
                                  <Camera className="w-2.5 h-2.5" />
                                  {imgCount}
                                </span>
                              )}
                            </div>
                            <div className="whitespace-nowrap">
                              <div className="font-bold text-white whitespace-nowrap">{p.nameFr}</div>
                              {p.nameAr && (
                                <div className="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">{p.nameAr}</div>
                              )}
                              {p.badgeFr && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300 whitespace-nowrap">
                                  {isRtl ? p.badgeAr || p.badgeFr : p.badgeFr}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 text-xs font-medium whitespace-nowrap">
                            {getCategoryName(p.category)}
                          </span>
                        </td>
                        <td className="p-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-black text-white whitespace-nowrap">
                            {p.price?.toLocaleString()} DZD
                          </div>
                          {p.oldPrice && (
                            <div className="text-[11px] text-zinc-500 line-through font-mono whitespace-nowrap">
                              {p.oldPrice?.toLocaleString()} DZD
                            </div>
                          )}
                        </td>
                        <td className="p-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block whitespace-nowrap ${
                              p.inStock
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                                : "bg-rose-950 text-rose-400 border border-rose-500/40"
                            }`}
                          >
                            {p.inStock ? t.admin.productsTab.inStock : t.admin.productsTab.outOfStock}
                          </span>
                        </td>
                        <td className="p-3 px-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingProduct({
                                  ...p,
                                  images: Array.isArray(p.images) && p.images.length > 0
                                    ? [...p.images]
                                    : (p.image ? [p.image] : [])
                                });
                                setShowProductModal(true);
                              }}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                              title={isRtl ? "تعديل" : "Modifier"}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(t.admin.productsTab.deleteConfirm || "Supprimer ce produit ?")) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                              title={isRtl ? "حذف" : "Supprimer"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-10 text-zinc-500 glass-panel rounded-2xl border border-zinc-800 p-6">
              {t.admin.productsTab.noData || "Aucun produit trouvé."}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const imgCount = Array.isArray(p.images) && p.images.length > 0 ? p.images.length : (p.image ? 1 : 0);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-card hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top: Image + Names + Price */}
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={p.image || "/biled-lens.jpg"}
                          alt={p.nameFr}
                          className="w-16 h-16 rounded-xl object-cover bg-zinc-950 border border-zinc-700"
                        />
                        {imgCount > 1 && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-brand-red text-[10px] font-bold text-white shadow-md flex items-center gap-0.5">
                            <Camera className="w-2.5 h-2.5" />
                            {imgCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm leading-snug">{p.nameFr}</div>
                        {p.nameAr && (
                          <div className="text-xs text-zinc-400 mt-0.5 leading-snug">{p.nameAr}</div>
                        )}
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-mono font-black text-brand-redLight text-sm">
                            {p.price?.toLocaleString()} DZD
                          </span>
                          {p.oldPrice && (
                            <span className="text-[11px] text-zinc-500 line-through font-mono">
                              {p.oldPrice?.toLocaleString()} DZD
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium">
                        {getCategoryName(p.category)}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          p.inStock
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-950 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {p.inStock ? t.admin.productsTab.inStock : t.admin.productsTab.outOfStock}
                      </span>

                      {p.badgeFr && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                          {isRtl ? p.badgeAr || p.badgeFr : p.badgeFr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 mt-2">
                    <button
                      onClick={() => {
                        setEditingProduct({
                          ...p,
                          images: Array.isArray(p.images) && p.images.length > 0
                            ? [...p.images]
                            : (p.image ? [p.image] : [])
                        });
                        setShowProductModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{isRtl ? "تعديل" : "Modifier"}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(t.admin.productsTab.deleteConfirm || "Supprimer ce produit ?")) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950 text-rose-400 border border-rose-800/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? "حذف" : "Supprimer"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Product Add/Edit Modal with File Upload & Gallery & URL Input */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-brand-surface border border-zinc-700 p-4 sm:p-6 sm:p-8 space-y-5 text-start my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
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

              {/* Price, Old Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    {t.admin.productsTab.form.price} (DZD)
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
                    {isRtl ? "السعر القديم (اختياري)" : "Ancien Prix (barré)"}
                  </label>
                  <input
                    type="number"
                    placeholder="ex. 32000"
                    value={editingProduct.oldPrice || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, oldPrice: e.target.value })}
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

              {/* --- MULTI-IMAGE UPLOAD & MANAGEMENT SECTION --- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-brand-red" />
                    <span className="font-bold text-white text-xs sm:text-sm">
                      {isRtl ? "صور المنتج المتعددة واختيار الصورة الرئيسية" : "Photos du produit (Multi-images & Photo Principale)"}
                    </span>
                  </div>
                  {uploading && (
                    <span className="text-[11px] text-amber-400 font-bold animate-pulse">
                      Téléversement en cours...
                    </span>
                  )}
                </div>

                {/* Upload Button + URL input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Button */}
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-600 hover:border-brand-red text-white text-xs font-bold transition-all text-center">
                    <Upload className="w-4 h-4 text-brand-redLight shrink-0" />
                    <span>{isRtl ? "رفع عدة صور معاً (Téléverser)" : "Téléverser plusieurs photos"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Add by URL / Filename */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomUrl();
                        }
                      }}
                      placeholder="Lien ou nom: /photo.jpg..."
                      className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomUrl}
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Workshop Presets (1-click quick add) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    {isRtl ? "أو أضف من صور الورشة الجاهزة بنقرة واحدة :" : "Ou ajoutez depuis les photos d'atelier :"}
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_GALLERY.map((item) => {
                      const isAdded = editingProduct.images?.includes(item.url);
                      const isMain = editingProduct.image === item.url;
                      return (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => handleAddPreset(item.url)}
                          className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                            isMain
                              ? "border-brand-red ring-2 ring-brand-red scale-105"
                              : isAdded
                              ? "border-emerald-500 opacity-90"
                              : "border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100"
                          }`}
                          title={`${item.label} (Cliquer pour ajouter / définir principale)`}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          {isMain && (
                            <div className="absolute inset-0 bg-brand-red/30 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* --- CURRENT PRODUCT GALLERY & MAIN SELECTION --- */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">
                      {isRtl ? "صور هذا المنتج (اضغط لاختيار الصورة الرئيسية) :" : "Galerie du produit (Cliquez pour définir la photo principale) :"}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {editingProduct.images?.length || 0} photo(s)
                    </span>
                  </div>

                  {(!editingProduct.images || editingProduct.images.length === 0) ? (
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                      Aucune image ajoutée. Téléversez des photos ou choisissez ci-dessus.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {editingProduct.images.map((imgUrl, idx) => {
                        const isMain = (editingProduct.image === imgUrl) || (!editingProduct.image && idx === 0);
                        return (
                          <div
                            key={`${imgUrl}-${idx}`}
                            className={`group relative rounded-xl overflow-hidden border transition-all ${
                              isMain
                                ? "border-brand-red ring-2 ring-brand-red/80 shadow-glow-red"
                                : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                            }`}
                          >
                            <div className="aspect-square w-full bg-zinc-900 overflow-hidden">
                              <img
                                src={imgUrl}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            {/* Main Badge / Selection overlay */}
                            {isMain ? (
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                                <Star className="w-3 h-3 fill-white" />
                                <span>{isRtl ? "الرئيسية" : "Principale"}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(imgUrl)}
                                className="absolute inset-x-0 bottom-0 py-1 bg-black/80 hover:bg-brand-red text-white text-[10px] font-bold text-center opacity-90 group-hover:opacity-100 transition-colors"
                              >
                                {isRtl ? "تعيين كرئيسية" : "Définir principale"}
                              </button>
                            )}

                            {/* Delete image button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors"
                              title="Supprimer cette photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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

              <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 text-zinc-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    id="inStockCheck"
                    checked={editingProduct.inStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-red bg-zinc-900 border-zinc-700"
                  />
                  <span>{t.admin.productsTab.form.inStock}</span>
                </label>

                <label className="flex items-center gap-2 text-rose-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    id="isPromoCheck"
                    checked={Boolean(editingProduct.isPromo)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPromo: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>{isRtl ? "تخفيض / عرض خاص (Promo)" : "En Promotion (Promo)"}</span>
                </label>

                <label className="flex items-center gap-2 text-amber-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    id="isNewCheck"
                    checked={Boolean(editingProduct.isNew)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>{isRtl ? "منتج جديد / وصل حديثاً" : "Nouveauté (Nouveau)"}</span>
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
                  const currentImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
                    ? editingProduct.images
                    : (editingProduct.image ? [editingProduct.image] : ["/biled-lens.jpg"]);
                  const mainImage = editingProduct.image || currentImages[0] || "/biled-lens.jpg";

                  await saveProduct({
                    ...editingProduct,
                    image: mainImage,
                    images: currentImages
                  });
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