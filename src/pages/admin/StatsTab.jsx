import React from "react";
import { Download, CheckCircle2, RotateCcw, PackageCheck, Clock, Truck, TrendingUp, ShoppingBag, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";

/**
 * Helper to calculate product price only for an order (excluding delivery fees).
 */
export function getOrderProductsTotal(order) {
  if (!order) return 0;

  // 1. If explicit subtotal exists and is valid
  if (
    order.subtotal !== undefined &&
    order.subtotal !== null &&
    !isNaN(Number(order.subtotal)) &&
    Number(order.subtotal) > 0
  ) {
    return Number(order.subtotal);
  }

  // 2. If items array exists
  if (Array.isArray(order.items) && order.items.length > 0) {
    const itemsSum = order.items.reduce((acc, it) => {
      const price = Number(it.productPrice || it.price) || 0;
      const qty = Math.max(1, Number(it.quantity) || 1);
      return acc + price * qty;
    }, 0);
    if (itemsSum > 0) return itemsSum;
  }

  // 3. If single productPrice and quantity
  if (order.productPrice !== undefined && Number(order.productPrice) > 0) {
    const qty = Math.max(1, Number(order.quantity) || 1);
    return Number(order.productPrice) * qty;
  }

  // 4. Fallback: total minus delivery fee
  const total = Number(order.total) || 0;
  const fee = Number(order.deliveryFee) || 0;
  return Math.max(0, total - fee);
}

export function StatsTab() {
  const { t, isRtl } = useLanguage();
  const { data } = useData();

  const appointments = data?.appointments || [];
  const products = data?.products || [];
  const orders = data?.orders || [];

  // Categorize orders by status
  const deliveredOrders = orders.filter((o) => {
    const st = (o.status || "").toLowerCase().trim();
    return st === "livre" || st === "livré" || st === "livree";
  });

  const returnedOrders = orders.filter((o) => {
    const st = (o.status || "").toLowerCase().trim();
    return st === "retourne" || st === "retourné" || st === "retournee";
  });

  const newOrders = orders.filter((o) => (o.status || "nouveau") === "nouveau");
  const confirmedOrders = orders.filter((o) => o.status === "confirme");
  const shippedOrders = orders.filter((o) => o.status === "expedie");
  const cancelledOrders = orders.filter((o) => o.status === "annule");

  // STRICT REQUIREMENT: Calculate ONLY delivered products, without delivery fees!
  const deliveredProductsRevenue = deliveredOrders.reduce((sum, o) => {
    return sum + getOrderProductsTotal(o);
  }, 0);

  const exportAppointmentsCsv = () => {
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

  const exportOrdersCsv = () => {
    if (!orders.length) return;
    const headers = [
      "ID Commande",
      "Date",
      "Nom Client",
      "Telephone",
      "Wilaya",
      "Commune",
      "Mode Livraison",
      "Frais Livraison DZD",
      "Produits",
      "Prix Produits (Hors Livraison) DZD",
      "Total Commande DZD",
      "Statut"
    ];
    const rows = orders.map((o) => {
      const prodTotal = getOrderProductsTotal(o);
      return [
        o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : "",
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${(o.wilaya || "").replace(/"/g, '""')}"`,
        `"${(o.commune || "").replace(/"/g, '""')}"`,
        o.deliveryType === "desk" ? "Bureau (Stop Desk)" : "A Domicile",
        o.deliveryFee || 0,
        `"${(o.productName || "").replace(/"/g, '""')}"`,
        prodTotal,
        o.total || (prodTotal + (Number(o.deliveryFee) || 0)),
        o.status || "nouveau"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `autoled_commandes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-start max-w-4xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>{t.admin.statsTab.title}</span>
        </h3>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* VENTES PRODUITS LIVRES (HORS FRAIS DE LIVRAISON) */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/40 bg-emerald-950/10 relative overflow-hidden group">
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {deliveredProductsRevenue.toLocaleString()} <span className="text-xs">DZD</span>
          </div>
          <div className="text-xs font-bold text-emerald-200 mt-1">
            {t.admin.statsTab.deliveredRevenue || (isRtl ? "مبيعات المنتجات المسلّمة (بدون توصيل)" : "Ventes Produits Livrés (hors livraison)")}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {deliveredOrders.length} {isRtl ? "طلبية مسلّمة" : (deliveredOrders.length > 1 ? "commandes livrées" : "commande livrée")}
            </span>
          </div>
        </div>

        {/* COMMANDES RETOURNEES */}
        <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 bg-purple-950/10">
          <div className="text-2xl sm:text-3xl font-black text-purple-400">{returnedOrders.length}</div>
          <div className="text-xs text-zinc-300 font-bold mt-1">
            {t.admin.statsTab.returnedOrdersCount || (isRtl ? "طلبيات مسترجعة (Retour)" : "Commandes Retournées")}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{isRtl ? "طرد راجع" : "colis non aboutis"}</span>
          </div>
        </div>

        {/* NOUVELLES DEMANDES */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-sky-400">
            {newOrders.length + appointments.filter((a) => (a.status || "nouveau") === "nouveau").length}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {isRtl ? "طلبات ومواعيد جديدة" : "Nouvelles Demandes"}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            {newOrders.length} cmd + {appointments.filter((a) => (a.status || "nouveau") === "nouveau").length} rdv
          </div>
        </div>

        {/* TOTAL COMMANDES PRODUITS */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{orders.length}</div>
          <div className="text-xs text-zinc-400 mt-1">
            {isRtl ? "إجمالي الطلبيات (شراء)" : "Commandes Produits"}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            {orders.length} {isRtl ? "طلبية مسجلة" : "commandes au total"}
          </div>
        </div>

        {/* TOTAL RENDEZ-VOUS */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-white">{appointments.length}</div>
          <div className="text-xs text-zinc-400 mt-1">{t.admin.statsTab.totalAppointments}</div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            {appointments.filter((a) => a.status === "confirme").length} {isRtl ? "مؤكد" : "confirmés"}
          </div>
        </div>

        {/* TOTAL PRODUITS EN BOUTIQUE */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="text-2xl sm:text-3xl font-black text-brand-redLight">{products.length}</div>
          <div className="text-xs text-zinc-400 mt-1">{t.admin.statsTab.totalProducts}</div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            {products.filter((p) => p.inStock).length} {isRtl ? "متوفر" : "en stock"}
          </div>
        </div>
      </div>

      {/* REPARTITION DES COMMANDES PAR STATUT */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-red" />
          <span>{isRtl ? "تفصيل حالة الطلبيات المسجلة" : "Répartition des Commandes par Statut"}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Nouveau */}
          <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 space-y-1">
            <div className="flex items-center justify-between text-sky-300 font-bold">
              <span>{isRtl ? "جديد" : "Nouveau"}</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-white font-mono">{newOrders.length}</div>
          </div>

          {/* Confirmé */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span>{isRtl ? "مؤكد" : "Confirmé"}</span>
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-white font-mono">{confirmedOrders.length}</div>
          </div>

          {/* Expédié */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span>{isRtl ? "تم الشحن" : "Expédié"}</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-white font-mono">{shippedOrders.length}</div>
          </div>

          {/* Livré */}
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-1">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span>{isRtl ? "تم التوصيل" : "Livré"}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-300 font-mono">{deliveredOrders.length}</div>
          </div>

          {/* Retourné */}
          <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 space-y-1">
            <div className="flex items-center justify-between text-purple-300 font-bold">
              <span>{isRtl ? "مسترجع" : "Retourné"}</span>
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black text-purple-300 font-mono">{returnedOrders.length}</div>
          </div>

          {/* Annulé */}
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
            <div className="flex items-center justify-between text-rose-300 font-bold">
              <span>{isRtl ? "ملغي" : "Annulé"}</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-white font-mono">{cancelledOrders.length}</div>
          </div>
        </div>
      </div>

      {/* EXPORT DATA & BACKUP */}
      <div className="p-6 rounded-3xl glass-panel border border-zinc-800 space-y-4">
        <h4 className="font-bold text-white text-base">
          {isRtl ? "تصدير البيانات والنسخ الاحتياطي" : "Export & Sauvegarde des Données"}
        </h4>
        <p className="text-xs text-zinc-400">
          {isRtl
            ? "يمكنك تحميل قائمة مواعيد الزبائن أو سجل الطلبيات بملف إكسل CSV لمتابعتها وحفظها على جهازك."
            : "Téléchargez l'historique complet de vos rendez-vous ou de vos commandes au format CSV compatible avec Microsoft Excel."}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={exportAppointmentsCsv}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-2 border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t.admin.statsTab.exportCsvBtn}</span>
          </button>

          <button
            onClick={exportOrdersCsv}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.admin.statsTab.exportOrdersCsvBtn || (isRtl ? "تحميل سجل الطلبيات (CSV Excel)" : "Télécharger les Commandes (CSV Excel)")}</span>
          </button>
        </div>

        <div className="pt-2 text-[11px] text-zinc-500 font-mono">
          {t.admin.statsTab.systemStatus}
        </div>
      </div>
    </div>
  );
}