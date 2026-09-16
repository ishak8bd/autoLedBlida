import React, { useState, useEffect, useRef } from "react";
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
  X,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  Copy
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import {
  ALGERIA_WILAYAS,
  getDefaultDeliveryFee,
  generateInitialDeliveryFees
} from "../../data/algeriaWilayasCommunes";
import {
  parseDeliveryInput,
  exportDeliveryFeesToCsv
} from "../../utils/deliveryParser";

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

  // Import File / Paste Text Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState("paste"); // "paste" or "file"
  const [pastedText, setPastedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parseResult, setParseResult] = useState({ detected: {}, errors: [], totalDetected: 0 });
  const [copiedSampleToast, setCopiedSampleToast] = useState(false);
  const fileInputRef = useRef(null);

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
  const handleTextChange = (text) => {
    setPastedText(text);
    const parsed = parseDeliveryInput(text, fees);
    setParseResult(parsed);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setPastedText(content);
      const parsed = parseDeliveryInput(content, fees);
      setParseResult(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleLoadSampleText = () => {
    const sample = `09 - Blida, 200, 350
16 - Alger, 300, 450
31 - Oran, 400, 650
25 - Constantine, 400, 650
13 - Tlemcen, 400, 650
15 - Tizi Ouzou, 350, 600
06 - Béjaïa, 400, 650
19 - Sétif, 400, 650
23 - Annaba, 400, 650
47 - Ghardaïa, 550, 900
30 - Ouargla, 550, 900
01 - Adrar, 850, 1300`;
    handleTextChange(sample);
  };

  const handleExportCsv = () => {
    const csvContent = exportDeliveryFeesToCsv(fees, ALGERIA_WILAYAS);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `autoled_tarifs_livraison_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyImport = async (andSave = false) => {
    if (!parseResult || parseResult.totalDetected === 0) return;

    const merged = { ...fees };
    Object.entries(parseResult.detected).forEach(([wKey, val]) => {
      merged[wKey] = {
        ...(merged[wKey] || getDefaultDeliveryFee(wKey)),
        desk: val.desk,
        home: val.home,
        active: val.active !== undefined ? val.active : true
      };
    });

    setFees(merged);
    setHasChanges(true);
    setShowImportModal(false);

    if (andSave) {
      setSaving(true);
      try {
        await saveDeliveryFees(merged);
        setHasChanges(false);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3500);
      } catch (err) {
        console.error("Error saving imported delivery fees:", err);
      } finally {
        setSaving(false);
      }
    }
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

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Import file / paste text button */}
          <button
            onClick={() => {
              setPastedText("");
              setUploadedFileName("");
              setParseResult({ detected: {}, errors: [], totalDetected: 0 });
              setShowImportModal(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            title={isRtl ? "استيراد ملف أو لصق نص الأسعار" : "Importer un fichier ou coller du texte"}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRtl ? "استيراد (ملف/نص)" : "Importer (Fichier/Texte)"}</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title={isRtl ? "تصدير ملف CSV للأسعار" : "Exporter les tarifs en CSV"}
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden lg:inline">{isRtl ? "تصدير CSV" : "Exporter CSV"}</span>
          </button>

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
                      step="any"
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
                      step="any"
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
                          step="any"
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
                          step="any"
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
                  step="any"
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
                  step="any"
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

      {/* IMPORT MODAL: UPLOAD FILE OR PASTE TEXT */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-zinc-900 z-10">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isRtl ? "استيراد أسعار التوصيل (ملف أو لصق نص)" : "Importer les Tarifs de Livraison (Fichier ou Texte)"}</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isRtl
                    ? "يمكنك لصق قائمة الأسعار أو رفع ملف CSV / TXT / JSON لتحديث أسعار الولايات دفعة واحدة."
                    : "Téléversez un fichier CSV/TXT/JSON ou collez directement votre grille tarifaire."}
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: Coller du texte / Téléverser un fichier */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 shrink-0 bg-zinc-900/60 border-b border-zinc-800/80">
              <button
                type="button"
                onClick={() => setImportMode("paste")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  importMode === "paste"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isRtl ? "لصق نص الأسعار" : "Coller du Texte"}</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode("file")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  importMode === "file"
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isRtl ? "رفع ملف (CSV, TXT, JSON)" : "Téléverser un Fichier"}</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain scrollbar-thin">
              {importMode === "paste" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-zinc-300 font-bold">
                      {isRtl ? "الصق نص الأسعار هنا:" : "Collez votre texte ou tableau ici :"}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleText}
                        className="text-amber-400 hover:text-amber-300 text-[11px] underline"
                      >
                        {isRtl ? "نموذج مثال" : "Exemple de format"}
                      </button>
                      {pastedText && (
                        <button
                          type="button"
                          onClick={() => handleTextChange("")}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          {isRtl ? "مسح" : "Effacer"}
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`Exemples acceptés :
09 - Blida, 200, 350
16 - Alger, 300, 450
31 - Oran : Bureau 400 DA, Domicile 650 DA
Wilaya 25 (Constantine) : 400 / 650
...`}
                    className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-zinc-600 leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs text-zinc-300 font-bold mb-1">
                    {isRtl ? "اختر ملف الأسعار من جهازك:" : "Sélectionnez un fichier sur votre appareil :"}
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/80 bg-zinc-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.json,.tsv,text/plain,text/csv,application/json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white mb-1">
                      {uploadedFileName || (isRtl ? "اضغط لاختيار ملف (CSV, TXT, JSON, TSV)" : "Cliquez ou glissez un fichier CSV, TXT ou JSON")}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {isRtl ? "متوافق مع ملفات إكسل المصدرة كـ CSV أو ملفات النصوص" : "Compatible avec les exports Excel CSV, les grilles Yalidine/ZR et les fichiers texte"}
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                      <span className="font-mono text-zinc-300 truncate max-w-xs">{uploadedFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName("");
                          handleTextChange("");
                        }}
                        className="text-rose-400 hover:text-rose-300 text-[11px]"
                      >
                        {isRtl ? "حذف الملف" : "Retirer"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Helper Tools: Download template / Export current CSV */}
              <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 text-[11px]">
                  {isRtl ? "تحميل نموذج فارغ أو جاهز للتعديل في Excel:" : "Modèle pré-rempli à éditer dans Excel :"}
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>{isRtl ? "تحميل ملف CSV الـ 69 ولاية" : "Télécharger Modèle CSV"}</span>
                </button>
              </div>

              {/* PARSE RESULTS & PREVIEW */}
              {parseResult.totalDetected > 0 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isRtl
                          ? `تم التعرف بنجاح على أسعار ${parseResult.totalDetected} ولاية من أصل 69 ولاية !`
                          : `${parseResult.totalDetected} wilayas détectées avec succès sur 69 !`}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                      {parseResult.totalDetected}/69
                    </span>
                  </div>

                  {parseResult.errors.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? `${parseResult.errors.length} أسطر تم تجاهلها أو غير مفهومة` : `${parseResult.errors.length} ligne(s) ignorée(s) ou non reconnues`}</span>
                      </div>
                      <div className="text-zinc-400 max-h-16 overflow-y-auto space-y-0.5 font-mono text-[10px]">
                        {parseResult.errors.slice(0, 3).map((err, idx) => (
                          <div key={idx}>Ligne {err.lineIndex}: "{err.line}" ({err.reason})</div>
                        ))}
                        {parseResult.errors.length > 3 && (
                          <div>... et {parseResult.errors.length - 3} autres.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950/60">
                    <div className="p-2.5 px-3 bg-zinc-900 border-b border-zinc-800 text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span>{isRtl ? "معاينة الأسعار المستخرجة :" : "Aperçu des tarifs extraits :"}</span>
                      <span className="text-[11px] text-zinc-500 font-normal">
                        {isRtl ? "المكتب / المنزل" : "Bureau / Domicile"}
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60 scrollbar-thin text-xs">
                      {Object.entries(parseResult.detected).map(([wKey, newFee]) => {
                        const currentFee = fees[wKey] || getDefaultDeliveryFee(wKey);
                        const isDeskChanged = currentFee.desk !== newFee.desk;
                        const isHomeChanged = currentFee.home !== newFee.home;

                        return (
                          <div key={wKey} className="p-2.5 px-3 flex items-center justify-between gap-2 hover:bg-zinc-900/40">
                            <div className="font-medium text-white truncate max-w-[200px]">
                              {wKey}
                            </div>
                            <div className="flex items-center gap-3 font-mono text-xs">
                              <div className="text-end">
                                <span className="text-zinc-500 text-[10px] block">Bureau</span>
                                <span className={isDeskChanged ? "text-amber-300 font-bold" : "text-zinc-300"}>
                                  {newFee.desk} DZD
                                </span>
                              </div>
                              <div className="text-end">
                                <span className="text-zinc-500 text-[10px] block">Maison</span>
                                <span className={isHomeChanged ? "text-emerald-400 font-bold" : "text-zinc-300"}>
                                  {newFee.home} DZD
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                (pastedText.trim() || uploadedFileName) && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {isRtl
                        ? "لم يتم التعرف على أي أسعار ولايات في هذا النص أو الملف. يرجى التحقق من التنسيق."
                        : "Aucun tarif de wilaya valide n’a été détecté. Vérifiez le format (ex. 09 - Blida, 200, 350)."}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-4 py-3 sm:px-6 sm:py-3.5 shrink-0 bg-zinc-900 z-10">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                {isRtl ? "إلغاء" : "Annuler"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={parseResult.totalDetected === 0}
                  onClick={() => handleApplyImport(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-zinc-700"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isRtl
                      ? `تطبيق (${parseResult.totalDetected})`
                      : `Appliquer (${parseResult.totalDetected})`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={parseResult.totalDetected === 0 || saving}
                  onClick={() => handleApplyImport(true)}
                  className="px-5 py-2 rounded-xl bg-brand-red hover:bg-brand-redDark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-glow-red flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isRtl
                      ? `تطبيق وحفظ الآن`
                      : `Appliquer & Enregistrer`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
