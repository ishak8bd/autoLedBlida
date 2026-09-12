import React, { useState, useEffect } from "react";
import {
  Truck,
  Home,
  Building2,
  Search,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  X
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import {
  ALGERIA_WILAYAS,
  getDefaultDeliveryFee,
  generateInitialDeliveryFees
} from "../../data/algeriaWilayasCommunes";

export function DeliveryTab() {
  const { isRtl } = useLanguage();
  const { data, saveDeliveryFees } = useData();

  const [fees, setFees] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkHomePrice, setBulkHomePrice] = useState(700);
  const [bulkDeskPrice, setBulkDeskPrice] = useState(450);

  // Sync with data
  useEffect(() => {
    if (data?.deliveryFees && Object.keys(data.deliveryFees).length > 0) {
      const merged = { ...generateInitialDeliveryFees(), ...data.deliveryFees };
      setFees(merged);
    } else {
      setFees(generateInitialDeliveryFees());
    }
  }, [data?.deliveryFees]);

  const getWilayaZone = (wilayaKey) => {
    const num = parseInt(wilayaKey?.split(" - ")[0], 10);
    if ([9, 16, 42, 35, 26].includes(num)) return "center";
    if ([1, 11, 33, 37, 49, 50, 52, 53, 54, 56, 3, 7, 8, 17, 30, 32, 39, 45, 47, 51, 55, 57, 58].includes(num)) return "south";
    if ([5, 14, 20, 22, 24, 28, 29, 34, 12, 4, 41, 43, 40, 48, 46, 38, 36, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69].includes(num)) return "plateaux";
    return "north";
  };

  // Filtered wilayas
  const filteredWilayas = ALGERIA_WILAYAS.filter((w) => {
    const matchesSearch =
      !searchQuery ||
      w.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.split(" - ")[0].includes(searchQuery);

    const matchesZone =
      zoneFilter === "all" || getWilayaZone(w) === zoneFilter;

    return matchesSearch && matchesZone;
  });

  const handlePriceChange = (wilaya, field, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    setFees((prev) => ({
      ...prev,
      [wilaya]: {
        ...(prev[wilaya] || getDefaultDeliveryFee(wilaya)),
        [field]: val
      }
    }));
    setHasChanges(true);
  };

  const handleStepPrice = (wilaya, field, delta) => {
    const current = fees[wilaya]?.[field] ?? getDefaultDeliveryFee(wilaya)[field];
    const newVal = Math.max(0, current + delta);
    handlePriceChange(wilaya, field, newVal);
  };

  const handleToggleActive = (wilaya) => {
    const current = fees[wilaya]?.active ?? true;
    setFees((prev) => ({
      ...prev,
      [wilaya]: {
        ...(prev[wilaya] || getDefaultDeliveryFee(wilaya)),
        active: !current
      }
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveDeliveryFees(fees);
      setHasChanges(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } catch (err) {
      console.error("Error saving delivery fees:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm(isRtl ? "هل تريد استعادة الأسعار الموصى بها لجميع الولايات الـ 69 ؟" : "Rétablir les tarifs conseillés pour toutes les 69 wilayas ?")) {
      const defaults = generateInitialDeliveryFees();
      setFees(defaults);
      setHasChanges(true);
    }
  };

  const handleApplyBulk = () => {
    const updated = { ...fees };
    filteredWilayas.forEach((w) => {
      updated[w] = {
        ...(updated[w] || getDefaultDeliveryFee(w)),
        home: Number(bulkHomePrice) || 700,
        desk: Number(bulkDeskPrice) || 450
      };
    });
    setFees(updated);
    setHasChanges(true);
    setShowBulkModal(false);
  };

  return (
    <div className="space-y-6 text-start">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-red" />
            <span>{isRtl ? "أسعار التوصيل حسب الولاية (69 ولاية)" : "Tarifs de Livraison par Wilaya (69 Wilayas)"}</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {isRtl
              ? "تحديد سعر التوصيل إلى المكتب (Stop Desk) وإلى المنزل (Domicile) لكل ولاية، وتفعيل أو تعطيل التوصيل."
              : "Configurez les frais de livraison pour chaque wilaya : Récupération au Bureau (Stop Desk) et Livraison à Domicile (Maison)."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? "تعديل جماعي" : "Tarification Rapide"}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            title={isRtl ? "استعادة الافتراضي" : "Tarifs conseillés"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isRtl ? "الافتراضي" : "Conseillés"}</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-glow-red ${
              hasChanges
                ? "bg-brand-red hover:bg-brand-redDark text-white animate-pulse"
                : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (isRtl ? "جاري الحفظ..." : "Enregistrement...") : (isRtl ? "حفظ التغييرات" : "Enregistrer Tout")}</span>
          </button>
        </div>
      </div>

      {/* Floating Unsaved Changes Bar */}
      {hasChanges && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isRtl
                ? "لديك تعديلات على أسعار التوصيل لم يتم حفظها بعد ! اضغط على زر حفظ التغييرات."
                : "Vous avez des modifications non enregistrées. N’oubliez pas de cliquer sur « Enregistrer Tout »."}
            </span>
          </div>
          <button
            onClick={handleSaveAll}
            className="px-3 py-1 rounded-xl bg-amber-500 text-black font-extrabold text-xs shrink-0 hover:bg-amber-400 transition-colors"
          >
            {isRtl ? "حفظ الآن" : "Enregistrer"}
          </button>
        </div>
      )}

      {/* Toast Confirmation */}
      {showSavedToast && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">
            {isRtl ? "تم حفظ أسعار التوصيل لجميع الولايات بنجاح !" : "Tarifs de livraison enregistrés avec succès pour les 69 wilayas !"}
          </span>
        </div>
      )}

      {/* Search & Zone Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: isRtl ? "جميع الولايات (69)" : "Toutes (69)" },
            { id: "center", label: isRtl ? "الوسط والبليدة" : "Centre & Blida" },
            { id: "north", label: isRtl ? "الشمال والساحل" : "Nord & Côtes" },
            { id: "plateaux", label: isRtl ? "الهضاب العليا" : "Hauts Plateaux" },
            { id: "south", label: isRtl ? "الجنوب والصحراء" : "Sud & Sahara" }
          ].map((z) => (
            <button
              key={z.id}
              onClick={() => setZoneFilter(z.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                zoneFilter === z.id
                  ? "bg-zinc-100 text-zinc-950 font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث برقم الولاية أو اسمها (09، Blida...)" : "Rechercher une wilaya (09, Blida...)"}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* MOBILE VIEW: Cards (visible on phones, hidden on desktop) */}
      <div className="block md:hidden space-y-3">
        {filteredWilayas.map((wilaya) => {
          const fee = fees[wilaya] || getDefaultDeliveryFee(wilaya);
          const isBlida = wilaya.startsWith("09");

          return (
            <div
              key={wilaya}
              className={`p-4 rounded-2xl bg-zinc-900 border space-y-3 shadow-card transition-all ${
                fee.active ? "border-zinc-800" : "border-rose-900/30 opacity-60"
              }`}
            >
              {/* Header: Wilaya Name & Active Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-white text-sm">
                    {wilaya}
                  </div>
                  {isBlida && (
                    <span className="px-2 py-0.5 rounded-md bg-brand-red/20 border border-brand-red/40 text-[10px] font-bold text-brand-redLight">
                      {isRtl ? "مقر الورشة" : "Atelier"}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleActive(wilaya)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    fee.active
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-950 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {fee.active ? (isRtl ? "متاح" : "Actif") : (isRtl ? "معطل" : "Suspendu")}
                </button>
              </div>

              {/* Price Inputs Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                {/* Bureau / Stop Desk */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="text-[11px] text-zinc-400 font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isRtl ? "المكتب (Stop Desk)" : "Bureau (Stop Desk)"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepPrice(wilaya, "desk", -50)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={fee.desk}
                      onChange={(e) => handlePriceChange(wilaya, "desk", e.target.value)}
                      className="w-full text-center py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-black text-white text-xs focus:outline-none focus:border-brand-red"
                    />
                    <button
                      onClick={() => handleStepPrice(wilaya, "desk", 50)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 text-center font-mono">DZD</div>
                </div>

                {/* Maison / Domicile */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="text-[11px] text-zinc-400 font-bold flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRtl ? "المنزل (Domicile)" : "Maison (Domicile)"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepPrice(wilaya, "home", -50)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={fee.home}
                      onChange={(e) => handlePriceChange(wilaya, "home", e.target.value)}
                      className="w-full text-center py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-black text-white text-xs focus:outline-none focus:border-brand-red"
                    />
                    <button
                      onClick={() => handleStepPrice(wilaya, "home", 50)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 text-center font-mono">DZD</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Table (visible on md+, scrollable with min-w-[720px]) */}
      <div className="hidden md:block glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm min-w-[720px]">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3.5 px-4 text-start">{isRtl ? "الولاية" : "Code & Wilaya"}</th>
                <th className="p-3.5 px-4 text-start">{isRtl ? "حالة التوصيل" : "Statut"}</th>
                <th className="p-3.5 px-4 text-start">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isRtl ? "سعر المكتب (Stop Desk)" : "Prix Bureau (Stop Desk)"}</span>
                  </div>
                </th>
                <th className="p-3.5 px-4 text-start">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRtl ? "سعر المنزل (Domicile)" : "Prix Maison (Domicile)"}</span>
                  </div>
                </th>
                <th className="p-3.5 px-4 text-end">{isRtl ? "فرق السعر" : "Écart Domicile"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredWilayas.map((wilaya) => {
                const fee = fees[wilaya] || getDefaultDeliveryFee(wilaya);
                const isBlida = wilaya.startsWith("09");
                const diff = (fee.home || 0) - (fee.desk || 0);

                return (
                  <tr
                    key={wilaya}
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      !fee.active ? "opacity-60 bg-zinc-950/40" : ""
                    }`}
                  >
                    {/* Wilaya Name */}
                    <td className="p-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white font-mono text-sm">
                          {wilaya}
                        </div>
                        {isBlida && (
                          <span className="px-2 py-0.5 rounded-md bg-brand-red/20 border border-brand-red/40 text-[10px] font-bold text-brand-redLight">
                            {isRtl ? "الورشة" : "Atelier"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="p-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(wilaya)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          fee.active
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-950 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {fee.active ? (isRtl ? "مفعل" : "Actif") : (isRtl ? "معطل" : "Désactivé")}
                      </button>
                    </td>

                    {/* Bureau / Desk input */}
                    <td className="p-3.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[170px]">
                        <button
                          onClick={() => handleStepPrice(wilaya, "desk", -50)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                          title="-50 DZD"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={fee.desk}
                          onChange={(e) => handlePriceChange(wilaya, "desk", e.target.value)}
                          className="w-24 text-center py-1.5 px-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-brand-red"
                        />
                        <span className="text-xs text-zinc-400 font-mono">DZD</span>
                        <button
                          onClick={() => handleStepPrice(wilaya, "desk", 50)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                          title="+50 DZD"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Maison / Home input */}
                    <td className="p-3.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[170px]">
                        <button
                          onClick={() => handleStepPrice(wilaya, "home", -50)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                          title="-50 DZD"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={fee.home}
                          onChange={(e) => handlePriceChange(wilaya, "home", e.target.value)}
                          className="w-24 text-center py-1.5 px-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-brand-red"
                        />
                        <span className="text-xs text-zinc-400 font-mono">DZD</span>
                        <button
                          onClick={() => handleStepPrice(wilaya, "home", 50)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center shrink-0"
                          title="+50 DZD"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Difference */}
                    <td className="p-3.5 px-4 text-end">
                      <span className="font-mono font-semibold text-xs text-zinc-400">
                        +{diff} DZD
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK APPLY MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? "تعديل أسعار الولايات المعروضة دفعة واحدة" : "Tarification Rapide / Globale"}</span>
              </h4>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              {isRtl
                ? `سيتم تطبيق هذه الأسعار على جميع الولايات المعروضة حالياً (${filteredWilayas.length} ولاية).`
                : `Ces tarifs s’appliqueront à toutes les wilayas actuellement filtrées (${filteredWilayas.length} wilayas).`}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isRtl ? "سعر التوصيل للمكتب (Stop Desk) بـ د.ج" : "Prix Bureau (Stop Desk) en DZD"}</span>
                </label>
                <input
                  type="number"
                  step="50"
                  value={bulkDeskPrice}
                  onChange={(e) => setBulkDeskPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isRtl ? "سعر التوصيل للمنزل (Domicile) بـ د.ج" : "Prix Maison (Domicile) en DZD"}</span>
                </label>
                <input
                  type="number"
                  step="50"
                  value={bulkHomePrice}
                  onChange={(e) => setBulkHomePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
              >
                {isRtl ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                className="px-5 py-2 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-xs shadow-glow-red"
              >
                {isRtl ? "تطبيق على الولايات" : "Appliquer aux Wilayas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
