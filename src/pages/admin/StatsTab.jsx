import React from "react";
import { Download } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

export function StatsTab() {
  const { t, isRtl } = useLanguage();
  const { data } = useData();

  const appointments = data?.appointments || [];
  const products = data?.products || [];
  const orders = data?.orders || [];
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const exportCsv = () => {
    if (!appointments.length) return;
    const headers = ["ID", "Nom Client", "Telephone", "Vehicule", "Prestation", "Date Souhaitee", "Statut", "Date Creation", "Message"];
    const rows = appointments.map((a) => [
      a.id,
      `"${a.name || ""}"`,
      `"${a.phone || ""}"`,
      `"${a.vehicle || ""}"`,
      `"${a.service || ""}"`,
      a.preferredDate || "",
      a.status || "nouveau",
      a.createdAt || "",
      `"${(a.message || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `autoled_rendez_vous_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-start max-w-3xl">
      <h3 className="text-xl font-bold text-white">{t.admin.statsTab.title}</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{orders.length}</div>
          <div className="text-xs text-zinc-400 mt-1">
            {isRtl ? "إجمالي الطلبيات (شراء)" : "Commandes Produits"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-white">{appointments.length}</div>
          <div className="text-xs text-zinc-400 mt-1">{t.admin.statsTab.totalAppointments}</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-sky-400">
            {orders.filter((o) => o.status === "nouveau").length + appointments.filter((a) => a.status === "nouveau").length}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {isRtl ? "طلبات ومواعيد جديدة" : "Nouvelles Demandes"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {totalRevenue.toLocaleString()} <span className="text-xs">DZD</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {isRtl ? "حجم مبيعات الطلبيات" : "Volume Ventes Commandes"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-brand-redLight">{products.length}</div>
          <div className="text-xs text-zinc-400 mt-1">{t.admin.statsTab.totalProducts}</div>
        </div>
      </div>

      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base">
          {isRtl ? "تصدير البيانات والنسخ الاحتياطي" : "Export & Sauvegarde"}
        </h4>
        <p className="text-xs text-zinc-400">
          {isRtl
            ? "يمكنك تحميل قائمة جميع مواعيد الزبائن بملف إكسل CSV لمتابعتها وحفظها على حاسوبك."
            : "Téléchargez l'historique complet de vos rendez-vous au format CSV compatible avec Microsoft Excel."}
        </p>

        <button
          onClick={exportCsv}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{t.admin.statsTab.exportCsvBtn}</span>
        </button>

        <div className="pt-2 text-[11px] text-zinc-500 font-mono">
          {t.admin.statsTab.systemStatus}
        </div>
      </div>
    </div>
  );
}