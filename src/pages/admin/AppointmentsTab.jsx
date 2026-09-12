import React, { useState } from "react";
import { Search, Download, Phone, MessageSquare, Trash2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { getWhatsAppUrl } from "../../data/algeriaWilayasCommunes";

export function AppointmentsTab() {
  const { t, isRtl } = useLanguage();
  const { data, updateAppointmentStatus, deleteAppointment } = useData();

  const [aptFilter, setAptFilter] = useState("all");
  const [aptSearch, setAptSearch] = useState("");

  const appointments = data?.appointments || [];

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = aptFilter === "all" || a.status === aptFilter;
    const matchesQuery = !aptSearch ||
      (a.name || "").toLowerCase().includes(aptSearch.toLowerCase()) ||
      (a.phone || "").includes(aptSearch) ||
      (a.vehicle || "").toLowerCase().includes(aptSearch.toLowerCase());
    return matchesStatus && matchesQuery;
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

  return (
    <div className="space-y-6 text-start">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {["all", "nouveau", "confirme", "termine", "annule"].map((st) => (
            <button
              key={st}
              onClick={() => setAptFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                aptFilter === st
                  ? "bg-zinc-100 text-zinc-950 font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {st === "all" ? t.admin.appointmentsTab.filterAll : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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

      {/* Appointments Table */}
      <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
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
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    {t.admin.appointmentsTab.noData}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
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
                      {apt.preferredDate}
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
    </div>
  );
}