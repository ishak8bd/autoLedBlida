import React, { useState } from "react";
import {
  Search,
  Download,
  Phone,
  MessageSquare,
  Trash2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  X,
  AlertCircle,
  MapPin,
  User,
  Tag,
  Home,
  Building2,
  Package
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { getWhatsAppUrl, ALGERIA_WILAYAS, getCommunesByWilaya, isValidAlgerianPhone, cleanAlgerianPhone } from "../../data/algeriaWilayasCommunes";

export function getOrderProductsSummary(order) {
  if (!order) return { isMulti: false, totalQty: 1, items: [] };

  // 1. If items array exists
  if (Array.isArray(order.items) && order.items.length > 0) {
    const totalQty = order.items.reduce(
      (acc, it) => acc + Math.max(1, Number(it.quantity) || 1),
      0
    );
    return {
      isMulti: order.items.length > 1 || totalQty > 1,
      totalQty,
      items: order.items.map((it) => ({
        name: it.productName || it.nameFr || "Produit",
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Number(it.productPrice || it.price) || 0,
        image: it.productImage || it.image || ""
      }))
    };
  }

  const rawName = String(order.productName || "").trim();

  // 2. Multiline bullet string: "X articles\n•A (x1)\n•B (x2)"
  if (rawName.includes("•")) {
    const lines = rawName.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const bulletLines = lines.filter((l) => l.startsWith("•"));
    if (bulletLines.length > 0) {
      const parsedItems = bulletLines.map((line) => {
        const clean = line.replace(/^•\s*/, "");
        const m = clean.match(/^(.*?)(?:\s*\(x(\d+)\)|\s*x(\d+))\s*$/i);
        if (m) {
          return {
            name: m[1].trim(),
            quantity: parseInt(m[2] || m[3], 10) || 1
          };
        }
        return { name: clean, quantity: 1 };
      });
      const totalQty = parsedItems.reduce((acc, it) => acc + it.quantity, 0);
      return {
        isMulti: true,
        totalQty: totalQty || Number(order.quantity) || 1,
        items: parsedItems
      };
    }
  }

  // 3. Parenthesized string: "X articles (A x1, B x2...)"
  const parenMatch = rawName.match(/^\s*(\d+)\s+articles?\s*\((.+)\)\s*$/i);
  if (parenMatch) {
    const inner = parenMatch[2];
    const parts = inner.split(/,\s*(?=[^,]+(?:x|\(x)\d+)/i);
    const parsedItems = parts.map((part) => {
      const qMatch = part.match(/^(.*?)(?:\s*\(?x(\d+)\)?)\s*$/i);
      if (qMatch) {
        return {
          name: qMatch[1].trim(),
          quantity: parseInt(qMatch[2], 10) || 1
        };
      }
      return { name: part.trim(), quantity: 1 };
    });
    const totalQty = parsedItems.reduce((acc, it) => acc + it.quantity, 0);
    return {
      isMulti: true,
      totalQty: totalQty || Number(order.quantity) || parseInt(parenMatch[1], 10) || 1,
      items: parsedItems
    };
  }

  // 4. Single product
  const singleQty = Math.max(1, Number(order.quantity) || 1);
  return {
    isMulti: false,
    totalQty: singleQty,
    items: [
      {
        name: rawName || "Produit",
        quantity: singleQty,
        price: Number(order.productPrice) || 0,
        image: order.productImage || ""
      }
    ]
  };
}

export function OrdersTab() {
  const { t, isRtl } = useLanguage();
  const { data, saveOrder, updateOrderStatus, deleteOrder, getWilayaDeliveryFee } = useData();

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const orders = data?.orders || [];
  const products = data?.products || [];

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

  // Rank orders:
  // 1. "nouveau" status at the top
  // 2. Among "nouveau": ranked according to order date (createdAt) ascending -> older at top (FIFO)
  // 3. For other statuses: active first (confirme -> expedie -> livre -> annule), then older at top
  const STATUS_PRIORITY = {
    nouveau: 0,
    confirme: 1,
    expedie: 2,
    livre: 3,
    annule: 4
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const isNewA = (a.status || "nouveau") === "nouveau";
    const isNewB = (b.status || "nouveau") === "nouveau";

    // 1. Les nouvelles commandes on top
    if (isNewA && !isNewB) return -1;
    if (!isNewA && isNewB) return 1;

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    // 2. Si les deux sont "nouveau" : classées selon date de commande, plus ancienne en haut (older at top)
    if (isNewA && isNewB) {
      if (timeA !== timeB) return timeA - timeB; // smaller timestamp = older date = top
      return String(a.id || "").localeCompare(String(b.id || ""));
    }

    // 3. Pour les autres statuts (non-nouveau) :
    const prioA = STATUS_PRIORITY[a.status] !== undefined ? STATUS_PRIORITY[a.status] : 99;
    const prioB = STATUS_PRIORITY[b.status] !== undefined ? STATUS_PRIORITY[b.status] : 99;

    if (prioA !== prioB) return prioA - prioB;

    // Au sein du même statut, plus ancienne en haut
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  const exportCsv = () => {
    if (!sortedOrders.length) return;
    const headers = [
      "ID Commande",
      "Date",
      "Nom Client",
      "Telephone",
      "Wilaya",
      "Commune / Adresse",
      "Mode Livraison",
      "Frais Livraison DZD",
      "Produit",
      "Quantite",
      "Prix Unitaire",
      "Total DZD",
      "Vehicule / Remarque",
      "Statut"
    ];

    const rows = sortedOrders.map((o) => {
      const summary = getOrderProductsSummary(o);
      const prodStr = summary.isMulti
        ? `${summary.totalQty} articles:\n` + summary.items.map((it) => `• ${it.name} (x${it.quantity})`).join("\n")
        : `${summary.items[0]?.name || o.productName} (x${summary.totalQty})`;

      return [
        o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : "",
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${(o.wilaya || "").replace(/"/g, '""')}"`,
        `"${(o.commune || "").replace(/"/g, '""')}"`,
        o.deliveryType === "desk" ? "Bureau (Stop Desk)" : "A Domicile (Maison)",
        o.deliveryFee || 0,
        `"${prodStr.replace(/"/g, '""')}"`,
        summary.totalQty,
        o.productPrice || 0,
        o.total || ((o.productPrice || 0) * summary.totalQty + (o.deliveryFee || 0)),
        `"${(o.vehicleNote || "").replace(/"/g, '""')}"`,
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

  const handleOpenAdd = () => {
    const firstProd = products[0];
    const initialPrice = firstProd ? firstProd.price : 8500;
    const defaultWilaya = "09 - Blida";
    const wilayaFee = getWilayaDeliveryFee ? getWilayaDeliveryFee(defaultWilaya) : { home: 350, desk: 200 };
    const initialFee = wilayaFee.home || 350;

    setEditingOrder({
      customerName: "",
      phone: "",
      wilaya: defaultWilaya,
      commune: "",
      deliveryType: "home",
      deliveryFee: initialFee,
      productId: firstProd?.id || "",
      productName: firstProd?.nameFr || "Projecteur Bi-LED",
      productPrice: initialPrice,
      quantity: 1,
      subtotal: initialPrice,
      total: initialPrice + initialFee,
      vehicleNote: "",
      status: "nouveau"
    });
    setFormError("");
    setShowOrderModal(true);
  };

  const handleOpenEdit = (order) => {
    const qty = order.quantity || 1;
    const price = order.productPrice || 0;
    const sub = order.subtotal !== undefined ? order.subtotal : (price * qty);
    const wilayaFee = getWilayaDeliveryFee ? getWilayaDeliveryFee(order.wilaya) : { home: 500, desk: 300 };
    const curType = order.deliveryType || "home";
    const curFee = order.deliveryFee !== undefined ? order.deliveryFee : (curType === "desk" ? wilayaFee.desk : wilayaFee.home);
    const tot = order.total !== undefined ? order.total : (sub + curFee);

    setEditingOrder({
      ...order,
      customerName: order.customerName || "",
      phone: order.phone || "",
      wilaya: order.wilaya || "09 - Blida",
      commune: order.commune || "",
      deliveryType: curType,
      deliveryFee: curFee,
      productId: order.productId || "",
      productName: order.productName || "",
      productPrice: price,
      quantity: qty,
      subtotal: sub,
      total: tot,
      vehicleNote: order.vehicleNote || "",
      status: order.status || "nouveau"
    });
    setFormError("");
    setShowOrderModal(true);
  };

  const handleProductSelectChange = (e) => {
    const selectedProdId = e.target.value;
    if (selectedProdId === "custom") {
      setEditingOrder((prev) => ({
        ...prev,
        productId: "",
        productName: ""
      }));
      return;
    }
    const found = products.find((p) => p.id === selectedProdId);
    if (found) {
      const qty = Number(editingOrder.quantity) || 1;
      const fee = Number(editingOrder.deliveryFee) || 0;
      const sub = (found.price || 0) * qty;
      setEditingOrder((prev) => ({
        ...prev,
        productId: found.id,
        productName: found.nameFr || found.nameAr || "",
        productPrice: found.price || 0,
        subtotal: sub,
        total: sub + fee
      }));
    }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!editingOrder.customerName?.trim() || !editingOrder.phone?.trim() || !editingOrder.productName?.trim()) {
      setFormError(isRtl ? "يرجى ملء اسم الزبون، رقم الهاتف والمنتج" : "Veuillez remplir le nom du client, le téléphone et le produit");
      return;
    }

    if (!isValidAlgerianPhone(editingOrder.phone)) {
      setFormError(isRtl ? "رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05، 06 أو 07." : "Numéro de téléphone invalide (10 chiffres, commençant par 05, 06 ou 07)");
      return;
    }

    setSaving(true);
    try {
      const qty = Math.max(1, Number(editingOrder.quantity) || 1);
      const price = Number(editingOrder.productPrice) || 0;
      const sub = price * qty;
      const fee = Number(editingOrder.deliveryFee) || 0;
      const finalTotal = editingOrder.total !== undefined ? Number(editingOrder.total) : (sub + fee);

      const payload = {
        ...editingOrder,
        customerName: editingOrder.customerName.trim(),
        phone: cleanAlgerianPhone(editingOrder.phone),
        quantity: qty,
        productPrice: price,
        deliveryType: editingOrder.deliveryType || "home",
        deliveryFee: fee,
        subtotal: sub,
        total: finalTotal
      };
      await saveOrder(payload);
      setShowOrderModal(false);
      setEditingOrder(null);
    } catch {
      setFormError(isRtl ? "حدث خطأ أثناء حفظ الطلبية" : "Erreur lors de l'enregistrement de la commande");
    } finally {
      setSaving(false);
    }
  };

  // Communes list for currently selected wilaya in modal
  const currentCommunes = editingOrder?.wilaya ? getCommunesByWilaya(editingOrder.wilaya) : [];

  return (
    <div className="space-y-6 text-start">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            <span>{t.admin.ordersTab.title}</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {isRtl
              ? "الطلبيات الجديدة في الأعلى، مرتبة حسب تاريخ الطلب (الأقدم أولاً لتسهيل المعالجة)."
              : "Nouvelles commandes en tête, classées par date de commande (les plus anciennes en premier)."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.admin.ordersTab.addBtn || (isRtl ? "طلب جديد" : "Nouvelle Commande")}</span>
          </button>

          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shrink-0"
            title="Exporter en CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.admin.ordersTab.exportCsvBtn}</span>
            <span className="inline sm:hidden">CSV</span>
          </button>
        </div>
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

      {/* MOBILE VIEW: Cards (visible on phones, hidden on desktop) */}
      <div className="block md:hidden space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 glass-panel rounded-2xl border border-zinc-800 p-6">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-50" />
            <div>{t.admin.ordersTab.noData}</div>
          </div>
        ) : (
          sortedOrders.map((o) => {
            const dateStr = o.createdAt
              ? new Date(o.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "";
            const totalVal = o.total !== undefined ? o.total : ((o.productPrice || 0) * (o.quantity || 1));
            const summary = getOrderProductsSummary(o);

            return (
              <div
                key={o.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-card"
              >
                {/* Header: ID + Date + Total */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-red" />
                      <span>{o.id}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="font-mono font-black text-emerald-400 text-sm">
                      {totalVal?.toLocaleString()} DZD
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {summary.totalQty} {summary.totalQty > 1 ? (isRtl ? "قطع" : "articles") : (isRtl ? "قطعة" : "article")}
                    </div>
                  </div>
                </div>

                {/* Client & Destination */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{o.customerName}</span>
                    </div>
                    <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{o.wilaya}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pl-5 rtl:pl-0 rtl:pr-5">
                    <span>{o.commune || ""}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.deliveryType === "desk"
                        ? "bg-sky-950/70 border border-sky-500/40 text-sky-300"
                        : "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
                    }`}>
                      {o.deliveryType === "desk" ? <Building2 className="w-3 h-3 text-sky-400" /> : <Home className="w-3 h-3 text-emerald-400" />}
                      <span>{o.deliveryType === "desk" ? "Bureau" : "Maison"} {o.deliveryFee ? `(+${o.deliveryFee} DZD)` : ""}</span>
                    </span>
                  </div>
                </div>

                {/* Product & Vehicle Note */}
                <div className="pt-2 border-t border-zinc-800/80 text-xs">
                  {summary.isMulti ? (
                    <div className="space-y-1 py-0.5">
                      <div className="font-bold text-amber-300 font-mono text-xs">
                        {summary.totalQty} {summary.totalQty > 1 ? (isRtl ? "قطع" : "articles") : (isRtl ? "قطعة" : "article")}
                      </div>
                      <div className="space-y-0.5">
                        {summary.items.map((item, idx) => (
                          <div key={idx} className="text-zinc-200 leading-snug">
                            <span className="text-zinc-400 font-bold mr-1 rtl:mr-0 rtl:ml-1">•</span>
                            <span className="font-medium text-white">{item.name}</span>{" "}
                            <span className="font-mono text-amber-300 font-bold">(x{item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="font-semibold text-white line-clamp-1">
                      📦 {summary.items[0]?.name || o.productName}
                      {summary.totalQty > 1 && (
                        <span className="font-mono text-amber-300 font-bold ml-1.5 rtl:mr-1.5">
                          (x{summary.totalQty})
                        </span>
                      )}
                    </div>
                  )}

                  {o.vehicleNote && (
                    <div className="text-[11px] text-brand-redLight font-medium truncate mt-1">
                      🚗 {o.vehicleNote}
                    </div>
                  )}
                </div>

                {/* Phone, Status & Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${o.phone}`}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 text-xs font-mono font-bold"
                      title={t.admin.ordersTab.callBtn}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px]">{o.phone}</span>
                    </a>

                    <a
                      href={getWhatsAppUrl(
                        o.phone,
                        isRtl
                          ? `سلام عليكم ${o.customerName}، بخصوص طلبيتك من متجر أوتو ليد البليدة:\n- رقم الطلبية: ${o.id}\n- المنتجات المطلوبة (${summary.totalQty} قطع):\n${summary.items.map((it) => `  • ${it.name} (x${it.quantity})`).join("\n")}\n- المجموع الكلي: ${totalVal?.toLocaleString()} د.ج...`
                          : `Bonjour ${o.customerName}, concernant votre commande (${summary.totalQty} articles) chez AutoLedBlida:\n${summary.items.map((it) => `• ${it.name} (x${it.quantity})`).join("\n")}\nTotal: ${totalVal?.toLocaleString()} DZD...`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white"
                      title={t.admin.ordersTab.whatsappBtn}
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    </a>
                  </div>

                  {/* Status selector */}
                  <select
                    value={o.status || "nouveau"}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    className={`text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none ${
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
                </div>

                {/* Bottom Edit & Delete buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                  <button
                    onClick={() => handleOpenEdit(o)}
                    className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{t.admin.ordersTab.editBtn || (isRtl ? "تعديل" : "Modifier")}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t.admin.ordersTab.deleteConfirm)) {
                        deleteOrder(o.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950 text-rose-400 border border-rose-800/40 font-bold text-xs flex items-center justify-center gap-1.5"
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

      {/* DESKTOP VIEW: Table (visible on md+, scrollable with min-w-[750px]) */}
      <div className="hidden md:block glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm min-w-[750px]">
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
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-50" />
                    <div>{t.admin.ordersTab.noData}</div>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o) => {
                  const dateStr = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "";

                  const totalVal = o.total !== undefined ? o.total : ((o.productPrice || 0) * (o.quantity || 1));
                  const summary = getOrderProductsSummary(o);

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

                      {/* Wilaya & Address & Delivery Mode */}
                      <td className="p-3.5 px-4">
                        <div className="font-bold text-emerald-400 text-xs">
                          {o.wilaya}
                        </div>
                        {o.commune && (
                          <div className="text-zinc-400 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                            {o.commune}
                          </div>
                        )}
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.deliveryType === "desk"
                              ? "bg-sky-950/70 border border-sky-500/40 text-sky-300"
                              : "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
                          }`}>
                            {o.deliveryType === "desk" ? <Building2 className="w-3 h-3 text-sky-400" /> : <Home className="w-3 h-3 text-emerald-400" />}
                            <span>{o.deliveryType === "desk" ? "Bureau" : "Maison"} {o.deliveryFee ? `(+${o.deliveryFee} DZD)` : ""}</span>
                          </span>
                        </div>
                      </td>

                      {/* Product & Quantity */}
                      <td className="p-3.5 px-4">
                        {summary.isMulti ? (
                          <div className="space-y-1 text-xs py-0.5 max-w-sm">
                            <div className="font-bold text-amber-300 font-mono text-xs">
                              {summary.totalQty} {summary.totalQty > 1 ? (isRtl ? "قطع" : "articles") : (isRtl ? "قطعة" : "article")}
                            </div>
                            <div className="space-y-0.5">
                              {summary.items.map((item, idx) => (
                                <div key={idx} className="text-zinc-200 leading-snug">
                                  <span className="text-zinc-400 font-bold mr-1 rtl:mr-0 rtl:ml-1">•</span>
                                  <span className="font-medium text-white">{item.name}</span>{" "}
                                  <span className="font-mono text-amber-300 font-bold whitespace-nowrap">(x{item.quantity})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
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
                                {summary.items[0]?.name || o.productName}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                Quantité : <span className="text-white font-bold">{summary.totalQty}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Total Price */}
                      <td className="p-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-black text-white text-sm">
                          {totalVal?.toLocaleString()} DZD
                        </div>
                        {o.deliveryFee !== undefined && (
                          <div className="text-[10px] text-zinc-400">
                            dont livr. {o.deliveryFee} DZD
                          </div>
                        )}
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
                                ? `سلام عليكم ${o.customerName}، بخصوص طلبيتك من متجر أوتو ليد البليدة:\n- رقم الطلبية: ${o.id}\n- المنتجات المطلوبة (${summary.totalQty} قطع):\n${summary.items.map((it) => `  • ${it.name} (x${it.quantity})`).join("\n")}\n- المجموع الكلي: ${totalVal?.toLocaleString()} د.ج...`
                                : `Bonjour ${o.customerName}, concernant votre commande (${summary.totalQty} articles) chez AutoLedBlida :\n${summary.items.map((it) => `• ${it.name} (x${it.quantity})`).join("\n")}\nTotal: ${totalVal?.toLocaleString()} DZD...`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white"
                            title={t.admin.ordersTab.whatsappBtn}
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                          </a>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(o)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
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

      {/* ADD / EDIT ORDER MODAL */}
      {showOrderModal && editingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
          onClick={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-zinc-900 z-10">
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-red shrink-0" />
                <span className="truncate">
                  {editingOrder.id
                    ? t.admin.ordersTab.editTitle || (isRtl ? "تعديل الطلبية" : "Modifier la Commande")
                    : t.admin.ordersTab.addTitle || (isRtl ? "إضافة طلبية جديدة" : "Créer une Commande")}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowOrderModal(false);
                  setEditingOrder(null);
                }}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping scrollable content and pinned footer */}
            <form onSubmit={handleSaveOrder} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-3.5 text-xs sm:text-sm">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Client Name */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "اسم الزبون *" : "Nom du client *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingOrder.customerName}
                      onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                      placeholder="Ex: Mohamed Amine"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "رقم الهاتف *" : "Téléphone *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={editingOrder.phone}
                      onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                      placeholder="0555 12 34 56"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Wilaya (1 to 69) */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "الولاية *" : "Wilaya de livraison *"}
                    </label>
                    <select
                      value={editingOrder.wilaya}
                      onChange={(e) => {
                        const newWilaya = e.target.value;
                        const communes = getCommunesByWilaya(newWilaya);
                        const feeObj = getWilayaDeliveryFee ? getWilayaDeliveryFee(newWilaya) : { home: 500, desk: 300 };
                        const curType = editingOrder.deliveryType || "home";
                        const newFee = curType === "desk" ? (feeObj.desk || 0) : (feeObj.home || 0);
                        const qty = Number(editingOrder.quantity) || 1;
                        const price = Number(editingOrder.productPrice) || 0;
                        setEditingOrder({
                          ...editingOrder,
                          wilaya: newWilaya,
                          commune: communes[0] || "",
                          deliveryFee: newFee,
                          total: (price * qty) + newFee
                        });
                      }}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-red text-sm"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Commune */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "البلدية أو العنوان" : "Commune / Adresse"}
                    </label>
                    {currentCommunes.length > 0 ? (
                      <select
                        value={editingOrder.commune}
                        onChange={(e) => setEditingOrder({ ...editingOrder, commune: e.target.value })}
                        className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-red text-sm"
                      >
                        <option value="">Sélectionner la commune</option>
                        {currentCommunes.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingOrder.commune}
                        onChange={(e) => setEditingOrder({ ...editingOrder, commune: e.target.value })}
                        placeholder="Commune / Adresse"
                        className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-sm"
                      />
                    )}
                  </div>
                </div>

                {/* Delivery Mode & Delivery Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "طريقة التوصيل" : "Mode de livraison"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const feeObj = getWilayaDeliveryFee ? getWilayaDeliveryFee(editingOrder.wilaya) : { home: 500, desk: 300 };
                          const newFee = feeObj.home || 0;
                          const qty = Number(editingOrder.quantity) || 1;
                          const price = Number(editingOrder.productPrice) || 0;
                          setEditingOrder({
                            ...editingOrder,
                            deliveryType: "home",
                            deliveryFee: newFee,
                            total: (price * qty) + newFee
                          });
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          (editingOrder.deliveryType || "home") === "home"
                            ? "bg-brand-red/20 border-brand-red text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{isRtl ? "منزل" : "Maison"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const feeObj = getWilayaDeliveryFee ? getWilayaDeliveryFee(editingOrder.wilaya) : { home: 500, desk: 300 };
                          const newFee = feeObj.desk || 0;
                          const qty = Number(editingOrder.quantity) || 1;
                          const price = Number(editingOrder.productPrice) || 0;
                          setEditingOrder({
                            ...editingOrder,
                            deliveryType: "desk",
                            deliveryFee: newFee,
                            total: (price * qty) + newFee
                          });
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          editingOrder.deliveryType === "desk"
                            ? "bg-brand-red/20 border-brand-red text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{isRtl ? "مكتب" : "Bureau (Desk)"}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "تكلفة التوصيل (د.ج)" : "Frais de livraison (DZD)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={editingOrder.deliveryFee ?? 0}
                      onChange={(e) => {
                        const newFee = Math.max(0, parseInt(e.target.value, 10) || 0);
                        const qty = Number(editingOrder.quantity) || 1;
                        const price = Number(editingOrder.productPrice) || 0;
                        setEditingOrder({
                          ...editingOrder,
                          deliveryFee: newFee,
                          total: (price * qty) + newFee
                        });
                      }}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono font-bold focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1 text-xs">
                    {isRtl ? "المنتج المطلوب *" : "Produit du catalogue *"}
                  </label>
                  <div className="space-y-2">
                    <select
                      value={editingOrder.productId || "custom"}
                      onChange={handleProductSelectChange}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-red font-medium text-sm"
                    >
                      <option value="custom">-- Saisir manuellement ou produit hors catalogue --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameFr} ({p.price?.toLocaleString()} DZD)
                        </option>
                      ))}
                    </select>

                    <textarea
                      rows={editingOrder.productName?.includes("\n") || editingOrder.productName?.includes("•") ? 3 : 2}
                      required
                      value={editingOrder.productName}
                      onChange={(e) => setEditingOrder({ ...editingOrder, productName: e.target.value })}
                      placeholder="Nom du produit ou liste des articles (ex. 4 articles: •...)"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {/* Quantity, Unit Price, Total (3 compact columns) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-[11px] sm:text-xs truncate">
                      {isRtl ? "الكمية" : "Quantité"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingOrder.quantity}
                      onChange={(e) => {
                        const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const price = Number(editingOrder.productPrice) || 0;
                        const fee = Number(editingOrder.deliveryFee) || 0;
                        setEditingOrder({
                          ...editingOrder,
                          quantity: newQty,
                          total: (price * newQty) + fee
                        });
                      }}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-brand-red text-center sm:text-left text-sm"
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-[11px] sm:text-xs truncate">
                      {isRtl ? "سعر الوحدة (د.ج)" : "P.U (DZD)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={editingOrder.productPrice}
                      onChange={(e) => {
                        const newPrice = Math.max(0, parseInt(e.target.value, 10) || 0);
                        const qty = Number(editingOrder.quantity) || 1;
                        const fee = Number(editingOrder.deliveryFee) || 0;
                        setEditingOrder({
                          ...editingOrder,
                          productPrice: newPrice,
                          total: (newPrice * qty) + fee
                        });
                      }}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-brand-red text-center sm:text-left text-sm"
                    />
                  </div>

                  {/* Total */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-[11px] sm:text-xs truncate">
                      {isRtl ? "المجموع (د.ج)" : "Total (DZD)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={editingOrder.total}
                      onChange={(e) => {
                        setEditingOrder({
                          ...editingOrder,
                          total: Math.max(0, parseInt(e.target.value, 10) || 0)
                        });
                      }}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono font-black focus:outline-none focus:border-brand-red text-center sm:text-left text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Vehicle Note */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "ملاحظة / طراز السيارة" : "Véhicule ou remarque"}
                    </label>
                    <input
                      type="text"
                      value={editingOrder.vehicleNote}
                      onChange={(e) => setEditingOrder({ ...editingOrder, vehicleNote: e.target.value })}
                      placeholder="Ex: Clio 4, ampoules H7..."
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "حالة الطلبية" : "Statut de la commande"}
                    </label>
                    <select
                      value={editingOrder.status || "nouveau"}
                      onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold focus:outline-none focus:border-brand-red text-sm"
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="confirme">Confirmé</option>
                      <option value="expedie">Expédié</option>
                      <option value="livre">Livré</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Buttons (Pinned at bottom) */}
              <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-10">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderModal(false);
                    setEditingOrder(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm text-center transition-colors cursor-pointer"
                >
                  {isRtl ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-xs sm:text-sm shadow-glow-red disabled:opacity-50 text-center transition-all cursor-pointer"
                >
                  {saving
                    ? (isRtl ? "جاري الحفظ..." : "Enregistrement...")
                    : (isRtl ? "حفظ الطلبية" : "Enregistrer la Commande")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
