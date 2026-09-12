import React, { useState } from "react";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function CategoriesTab() {
  const { t, isRtl } = useLanguage();
  const { data, saveCategory, deleteCategory } = useData();

  const [newCatFr, setNewCatFr] = useState("");
  const [newCatAr, setNewCatAr] = useState("");

  const categories = data?.categories || [];

  return (
    <div className="space-y-6 text-start max-w-2xl">
      <div>
        <h3 className="text-xl font-bold text-white">{t.admin.categoriesTab.title}</h3>
        <p className="text-xs text-zinc-400">
          {isRtl ? "إضافة وحذف أقسام المنتجات التي تظهر في شريط الفلترة بالمتجر" : "Les catégories alimentent la barre de filtre du catalogue storefront."}
        </p>
      </div>

      {/* Add Category Form */}
      <div className="p-5 rounded-2xl glass-panel border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          value={newCatFr}
          onChange={(e) => setNewCatFr(e.target.value)}
          placeholder={t.admin.categoriesTab.nameFr}
          className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
        />
        <input
          type="text"
          value={newCatAr}
          onChange={(e) => setNewCatAr(e.target.value)}
          placeholder={t.admin.categoriesTab.nameAr}
          className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs"
        />
        <button
          onClick={async () => {
            if (!newCatFr.trim()) return;
            await saveCategory({ nameFr: newCatFr, nameAr: newCatAr || newCatFr });
            setNewCatFr("");
            setNewCatAr("");
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red"
        >
          {t.admin.categoriesTab.saveBtn}
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FolderTree className="w-4 h-4 text-brand-red" />
              <span className="font-bold text-white text-sm">{c.nameFr}</span>
              <span className="text-xs text-zinc-400">({c.nameAr})</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm(t.admin.categoriesTab.deleteConfirm)) {
                  deleteCategory(c.id);
                }
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}