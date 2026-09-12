import React, { useState } from "react";
import { Search, Download, Phone, MessageSquare, Trash2, Plus, Edit, X, Calendar, Car, User, Wrench, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { getWhatsAppUrl, isValidAlgerianPhone, cleanAlgerianPhone } from "../../data/algeriaWilayasCommunes";

export function AppointmentsTab() {
  const { t, isRtl } = useLanguage();
  const { data, saveAppointment, updateAppointmentStatus, deleteAppointment } = useData();

  const [aptFilter, setAptFilter] = useState("all");
  const [aptSearch, setAptSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [editingApt, setEditingApt] = useState(null);
  const [showAptModal, setShowAptModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const appointments = data?.appointments || [];

  // Default preset services for quick selection
  const serviceOptions = [
    "Installation Bi-LED",
    "Rénovation & Polissage d'optiques",
    "Angel Eyes RGB / LED",
    "Conversion Full LED",
    "Kit Xénon 55W Fast Bright",
    "Réparation étanchéité & buée",
    "Personnalisation & Peinture masque noir"
  ];

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = aptFilter === "all" || a.status === aptFilter;
    const q = (aptSearch || "").toLowerCase();
    const matchesQuery = !aptSearch ||
      (a.name || "").toLowerCase().includes(q) ||
      (a.phone || "").includes(q) ||
      (a.vehicle || "").toLowerCase().includes(q) ||
      (a.service || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const formatReservationDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dmy = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const hm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      return `${dmy} à ${hm}`;
    } catch {
      return dateStr;
    }
  };

  // Rank by preferredDate (Date souhaitée) ascending, tie-breaker by createdAt (Date de réservation) ascending
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const timeA = a.preferredDate ? new Date(a.preferredDate).getTime() : Infinity;
    const timeB = b.preferredDate ? new Date(b.preferredDate).getTime() : Infinity;
    const validTimes = !isNaN(timeA) && !isNaN(timeB);

    if (validTimes && timeA !== timeB) {
      return timeA - timeB;
    } else if (!validTimes && a.preferredDate !== b.preferredDate) {
      if (!a.preferredDate) return 1;
      if (!b.preferredDate) return -1;
      return String(a.preferredDate).localeCompare(String(b.preferredDate));
    }

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdA - createdB;
  });

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

  const handleOpenAdd = () => {
    setEditingApt({
      name: "",
      phone: "",
      vehicle: "",
      service: serviceOptions[0],
      preferredDate: new Date().toISOString().split("T")[0],
      status: "nouveau",
      message: ""
    });
    setFormError("");
    setShowAptModal(true);
  };

  const handleOpenEdit = (apt) => {
    setEditingApt({
      ...apt,
      name: apt.name || "",
      phone: apt.phone || "",
      vehicle: apt.vehicle || "",
      service: apt.service || serviceOptions[0],
      preferredDate: apt.preferredDate || new Date().toISOString().split("T")[0],
      status: apt.status || "nouveau",
      message: apt.message || ""
    });
    setFormError("");
    setShowAptModal(true);
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!editingApt.name?.trim() || !editingApt.phone?.trim() || !editingApt.vehicle?.trim()) {
      setFormError(isRtl ? "يرجى ملء الاسم، الهاتف ونوع السيارة" : "Veuillez remplir le nom, téléphone et véhicule");
      return;
    }

    if (!isValidAlgerianPhone(editingApt.phone)) {
      setFormError(isRtl ? "رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 05، 06 أو 07." : "Numéro de téléphone invalide (10 chiffres, commençant par 05, 06 ou 07)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...editingApt,
        phone: cleanAlgerianPhone(editingApt.phone)
      };
      await saveAppointment(payload);
      setShowAptModal(false);
      setEditingApt(null);
    } catch {
      setFormError(isRtl ? "حدث خطأ أثناء الحفظ" : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Top Header: Title & Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-red" />
            <span>{t.admin.appointmentsTab.title}</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {isRtl
              ? "ترتيب حسب اليوم المطلوب ثم تاريخ الحجز مع إمكانية التعديل والإضافة الكاملة"
              : "Classés par date souhaitée puis date de réservation. Gestion complète (Ajout / Modification / Suppression)."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-redDark text-white text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.admin.appointmentsTab.addBtn || (isRtl ? "موعد جديد" : "Nouveau Rendez-vous")}</span>
          </button>

          <button
            onClick={exportCsv}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 shrink-0"
            title="Exporter en CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {["all", "nouveau", "confirme", "termine", "annule"].map((st) => (
            <button
              key={st}
              onClick={() => setAptFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                aptFilter === st
                  ? "bg-zinc-100 text-zinc-950 font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {st === "all" ? t.admin.appointmentsTab.filterAll : st}
              {st !== "all" && (
                <span className="ml-1.5 rtl:mr-1.5 px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                  {appointments.filter((a) => a.status === st).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={aptSearch}
              onChange={(e) => setAptSearch(e.target.value)}
              placeholder={t.admin.appointmentsTab.search}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red"
            />
          </div>

          {/* View Mode Toggle: Tableau / Cartes */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isRtl ? "جدول" : "Tableau"}
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
              {isRtl ? "بطاقات" : "Cartes"}
            </button>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS DISPLAY: Responsive Table or Responsive Cards */}
      {viewMode === "cards" ? (
        <div className="space-y-3">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 glass-panel rounded-2xl border border-zinc-800 p-6">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-50" />
            <div>{t.admin.appointmentsTab.noData}</div>
          </div>
        ) : (
          sortedAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-card"
            >
              {/* Header: Name + Preferred Date badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-red" />
                    <span>{apt.name}</span>
                  </div>
                  <div className="text-xs text-brand-redLight font-semibold mt-0.5 flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    <span>{apt.vehicle}</span>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <div className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>{apt.preferredDate}</span>
                  </div>
                  {apt.createdAt && (
                    <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-end gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5 text-zinc-500" />
                      <span>{isRtl ? "حُجز: " : "Réservé: "}{formatReservationDate(apt.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Message */}
              <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                  <Wrench className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="line-clamp-1">{apt.service}</span>
                </div>
                {apt.message && (
                  <div className="text-[11px] text-zinc-400 italic bg-zinc-950/60 p-2 rounded-lg mt-1.5 line-clamp-2">
                    “{apt.message}”
                  </div>
                )}
              </div>

              {/* Phone, Status & Actions */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${apt.phone}`}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 text-xs font-mono font-bold"
                    title="Appeler"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">{apt.phone}</span>
                  </a>

                  <a
                    href={getWhatsAppUrl(
                      apt.phone,
                      isRtl
                        ? `سلام عليكم ${apt.name}، بخصوص موعدكم في ورشة أوتو ليد لسيارة ${apt.vehicle}...`
                        : `Bonjour ${apt.name}, concernant votre rendez-vous pour votre ${apt.vehicle} chez AutoLedBlida...`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  </a>
                </div>

                {/* Status select */}
                <select
                  value={apt.status || "nouveau"}
                  onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                  className={`text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none ${
                    apt.status === "confirme"
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-400"
                      : apt.status === "termine"
                      ? "bg-zinc-800 border-zinc-600 text-zinc-300"
                      : apt.status === "annule"
                      ? "bg-rose-950/70 border-rose-500/50 text-rose-400"
                      : "bg-sky-950/70 border-sky-500/50 text-sky-400"
                  }`}
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="confirme">Confirmé</option>
                  <option value="termine">Terminé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              {/* Bottom Edit & Delete buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                <button
                  onClick={() => handleOpenEdit(apt)}
                  className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{t.admin.appointmentsTab.editBtn || (isRtl ? "تعديل" : "Modifier")}</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t.admin.appointmentsTab.deleteConfirm)) {
                      deleteAppointment(apt.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950 text-rose-400 border border-rose-800/40 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? "حذف" : "Supprimer"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    ) : (
      /* TABLE VIEW (Available on all devices with horizontal scrolling & swipe hint) */
      <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        {/* Mobile swipe hint */}
        <div className="block md:hidden text-[11px] text-zinc-400 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-center font-medium">
          {isRtl ? "مرر أفقياً لعرض كامل الجدول ↔" : "Glissez horizontalement pour voir tout le tableau ↔"}
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-start text-xs sm:text-sm min-w-[720px]">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colClient}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colPhone}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colVehicle}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colService}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colDate}</th>
                <th className="p-3.5 px-4 text-start">{t.admin.appointmentsTab.colStatus}</th>
                <th className="p-3.5 px-4 text-end">{t.admin.appointmentsTab.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    {t.admin.appointmentsTab.noData}
                  </td>
                </tr>
              ) : (
                sortedAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 px-4 font-bold text-white">
                      <div>{apt.name}</div>
                      {apt.message && (
                        <div className="text-[11px] text-zinc-400 font-normal italic line-clamp-1 max-w-xs">
                          “{apt.message}”
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 px-4 font-mono font-bold text-zinc-200">
                      {apt.phone}
                    </td>
                    <td className="p-3.5 px-4 text-brand-redLight font-semibold">
                      {apt.vehicle}
                    </td>
                    <td className="p-3.5 px-4 text-zinc-300">
                      {apt.service}
                    </td>
                    <td className="p-3.5 px-4 font-mono text-zinc-300">
                      <div className="font-bold text-amber-300">{apt.preferredDate}</div>
                      {apt.createdAt && (
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span>{isRtl ? "حجز: " : "Réservé: "}{formatReservationDate(apt.createdAt)}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 px-4">
                      <select
                        value={apt.status || "nouveau"}
                        onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          apt.status === "confirme"
                            ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-400"
                            : apt.status === "termine"
                            ? "bg-zinc-800 border-zinc-600 text-zinc-300"
                            : apt.status === "annule"
                            ? "bg-rose-950/70 border-rose-500/50 text-rose-400"
                            : "bg-sky-950/70 border-sky-500/50 text-sky-400"
                        }`}
                      >
                        <option value="nouveau">Nouveau</option>
                        <option value="confirme">Confirmé</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>
                    </td>
                    <td className="p-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${apt.phone}`}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          title="Appeler"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={getWhatsAppUrl(
                            apt.phone,
                            isRtl
                              ? `سلام عليكم ${apt.name}، بخصوص موعدكم في ورشة أوتو ليد لسيارة ${apt.vehicle}...`
                              : `Bonjour ${apt.name}, concernant votre rendez-vous pour votre ${apt.vehicle} chez AutoLedBlida...`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        </a>

                        <button
                          onClick={() => handleOpenEdit(apt)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(t.admin.appointmentsTab.deleteConfirm)) {
                              deleteAppointment(apt.id);
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* ADD / EDIT APPOINTMENT MODAL */}
      {showAptModal && editingApt && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
          onClick={() => {
            setShowAptModal(false);
            setEditingApt(null);
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-zinc-900 z-10">
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red shrink-0" />
                <span className="truncate">
                  {editingApt.id
                    ? t.admin.appointmentsTab.editTitle || (isRtl ? "تعديل الموعد" : "Modifier le Rendez-vous")
                    : t.admin.appointmentsTab.addTitle || (isRtl ? "إضافة موعد جديد" : "Nouveau Rendez-vous")}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAptModal(false);
                  setEditingApt(null);
                }}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping scrollable content and pinned footer */}
            <form onSubmit={handleSaveAppointment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                      value={editingApt.name}
                      onChange={(e) => setEditingApt({ ...editingApt, name: e.target.value })}
                      placeholder="Ex: Karim Bouzid"
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
                      value={editingApt.phone}
                      onChange={(e) => setEditingApt({ ...editingApt, phone: e.target.value })}
                      placeholder="0550 12 34 56"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Vehicle */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "نوع السيارة والطراز *" : "Véhicule (modèle/année) *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingApt.vehicle}
                      onChange={(e) => setEditingApt({ ...editingApt, vehicle: e.target.value })}
                      placeholder="Ex: Golf 7, Clio 4, Tucson..."
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "اليوم المطلوب للحضور *" : "Date souhaitée *"}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingApt.preferredDate}
                      onChange={(e) => setEditingApt({ ...editingApt, preferredDate: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Service */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "الخدمة المطلوبة *" : "Prestation demandée *"}
                    </label>
                    <select
                      value={editingApt.service}
                      onChange={(e) => setEditingApt({ ...editingApt, service: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-red text-sm"
                    >
                      {serviceOptions.map((srv) => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                      {editingApt.service && !serviceOptions.includes(editingApt.service) && (
                        <option value={editingApt.service}>{editingApt.service}</option>
                      )}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 text-xs">
                      {isRtl ? "حالة الموعد" : "Statut"}
                    </label>
                    <select
                      value={editingApt.status || "nouveau"}
                      onChange={(e) => setEditingApt({ ...editingApt, status: e.target.value })}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-brand-red font-bold text-sm"
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="confirme">Confirmé</option>
                      <option value="termine">Terminé</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                </div>

                {/* Message / Remarks */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1 text-xs">
                    {isRtl ? "ملاحظات أو تفاصيل إضافية" : "Remarques ou message"}
                  </label>
                  <textarea
                    rows={3}
                    value={editingApt.message}
                    onChange={(e) => setEditingApt({ ...editingApt, message: e.target.value })}
                    placeholder={isRtl ? "أي تفاصيل بخصوص نوع المصابيح أو العمل المطلوب..." : "Ex: Ampoules H7, optique fissuré, etc."}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-red resize-none text-sm"
                  />
                </div>
              </div>

              {/* Modal Buttons (Pinned at bottom) */}
              <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAptModal(false);
                    setEditingApt(null);
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
                    : (isRtl ? "حفظ الموعد" : "Enregistrer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}