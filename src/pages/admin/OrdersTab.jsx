import React, { useState } from "react";
import { Search, Download, Phone, MessageSquare, Trash2, ShoppingBag, Truck, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { getWhatsAppUrl } from "../../data/algeriaWilayasCommunes";

export function OrdersTab() {
  const { t, isRtl } = useLanguage();
  const { data, updateOrderStatus, deleteOrder } = useData();

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");

  const orders = data?.orders || [];

  // Filter orders by status & search
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === "all" || o.status === orderFilter;
    const q = orderSearch.toLowerCase();
    const matchesQuery = !orderSearch ||
      (o.customerName || "").toLowerCase().includes(q) ||
      (o.phone || "").includes(q) ||
      (o.wilaya || "").toLowerCase().includes(q) ||
      (o.productName || "").toLowerCase().includes(q) ||
      (o.id || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const exportCsv = () => {
    if (!orders.length) return;
    const headers = [
      "ID Commande",
      "Date",
      "Nom Client",
      "Telephone",
      "Wilaya",
      "Commune / Adresse",
      "Produit",
      "Quantite",
      "Prix Unitaire",
      "Total DZD",
      "Vehicule / Remarque",
      "Statut"
    ];

    const rows = orders.map((o) => [
      o.id,
      o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : "",
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${(o.phone || "").replace(/"/g, '""')}"`,
      `"${(o.wilaya || "").replace(/"/g, '""')}"`,
      `"${(o.commune || "").replace(/"/g, '""')}"`,
      `"${(o.productName || "").replace(/"/g, '""')}"`,
      o.quantity || 1,
      o.productPrice || 0,
      o.total || (o.productPrice * (o.quantity || 1)),
      `"${(o.vehicleNote || "").replace(/"/g, '""')}"`,
      o.status || "nouveau"
    ]);

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
    <div className="space-y-6 text-start">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            <span>{t.admin.ordersTab.title}</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {t.admin.ordersTab.subtitle}
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shrink-0"
          title="Exporter en CSV"
        >
          <Download className="w-4 h-4" />
          <span>{t.admin.ordersTab.exportCsvBtn}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: t.admin.ordersTab.filterAll },
            { id: "nouveau", label: t.admin.ordersTab.filterNew },
            { id: "confirme", label: t.admin.ordersTab.filterConfirmed },
            { id: "expedie", label: t.admin.ordersTab.filterShipped },
            { id: "livre", label: t.admin.ordersTab.filterDelivered },
            { id: "annule", label: t.admin.ordersTab.filterCancelled }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setOrderFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                orderFilter === st.id
                  ? "bg-zinc-100 text-zinc-950 font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {st.label}
              {st.id !== "all" && (
                <span className="ml-1.5 rtl:mr-1.5 px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                  {orders.filter((o) => o.status === st.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder={t.admin.ordersTab.search}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colOrder}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colClient}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colWilaya}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colProduct}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colTotal}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.ordersTab.colStatus}</th>
                <th className="p-3.5 px-4 text-end">{t.admin.ordersTab.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-50" />
                    <div>{t.admin.ordersTab.noData}</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const dateStr = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "";

                  return (
                    <tr key={o.id} className="hover:bg-zinc-800/40 transition-colors">
                      
                      {/* Order Ref & Date */}
                      <td className="p-3.5 px-4">
                        <div className="font-mono font-bold text-white text-xs">
                          {o.id}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Client & Phone */}
                      <td className="p-3.5 px-4">
                        <div className="font-bold text-white">{o.customerName}</div>
                        <div className="font-mono text-zinc-300 font-semibold text-xs mt-0.5">
                          {o.phone}
                        </div>
                        {o.vehicleNote && (
                          <div className="text-[11px] text-brand-redLight font-medium truncate max-w-xs mt-0.5">
                            🚗 {o.vehicleNote}
                          </div>
                        )}
                      </td>

                      {/* Wilaya & Address */}
                      <td className="p-3.5 px-4">
                        <div className="font-bold text-emerald-400 text-xs">
                          {o.wilaya}
                        </div>
                        {o.commune && (
                          <div className="text-zinc-400 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                            {o.commune}
                          </div>
                        )}
                      </td>

                      {/* Product & Quantity */}
                      <td className="p-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {o.productImage && (
                            <img
                              src={o.productImage}
                              alt={o.productName}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-white line-clamp-1 max-w-xs">
                              {o.productName}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              Quantité : <span className="text-white font-bold">{o.quantity || 1}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="p-3.5 px-4 font-mono font-black text-white text-sm whitespace-nowrap">
                        {(o.total || (o.productPrice * (o.quantity || 1)))?.toLocaleString()} DZD
                      </td>

                      {/* Status Selector */}
                      <td className="p-3.5 px-4">
                        <select
                          value={o.status || "nouveau"}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            o.status === "confirme"
                              ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-300"
                              : o.status === "expedie"
                              ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                              : o.status === "livre"
                              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                              : o.status === "annule"
                              ? "bg-rose-950/80 border-rose-500/50 text-rose-400"
                              : "bg-sky-950/80 border-sky-500/50 text-sky-300"
                          }`}
                        >
                          <option value="nouveau">Nouveau</option>
                          <option value="confirme">Confirmé</option>
                          <option value="expedie">Expédié</option>
                          <option value="livre">Livré</option>
                          <option value="annule">Annulé</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Phone call */}
                          <a
                            href={`tel:${o.phone}`}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                            title={t.admin.ordersTab.callBtn}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* WhatsApp chat */}
                          <a
                            href={getWhatsAppUrl(
                              o.phone,
                              isRtl
                                ? `سلام عليكم ${o.customerName}، بخصوص طلبيتك (${o.productName}) من متجر أوتو ليد البليدة...`
                                : `Bonjour ${o.customerName}, concernant votre commande (${o.productName}) chez AutoLedBlida...`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white"
                            title={t.admin.ordersTab.whatsappBtn}
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (window.confirm(t.admin.ordersTab.deleteConfirm)) {
                                deleteOrder(o.id);
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
