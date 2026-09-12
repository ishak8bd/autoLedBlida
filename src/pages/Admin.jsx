import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useData } from "../context/DataContext";
import {
  Calendar,
  ShoppingBag,
  FolderTree,
  Phone,
  Settings,
  BarChart3,
  LogOut,
  Globe
} from "lucide-react";

import { AdminPin } from "./admin/AdminPin";
import { OrdersTab } from "./admin/OrdersTab";
import { AppointmentsTab } from "./admin/AppointmentsTab";
import { ProductsTab } from "./admin/ProductsTab";
import { PhonesTab } from "./admin/PhonesTab";
import { CategoriesTab } from "./admin/CategoriesTab";
import { SettingsTab } from "./admin/SettingsTab";
import { StatsTab } from "./admin/StatsTab";

export function Admin({ onBackToSite }) {
  const { lang, toggleLang, isRtl, t } = useLanguage();
  const { data } = useData();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  const orders = data?.orders || [];
  const appointments = data?.appointments || [];
  const products = data?.products || [];
  const phoneNumbers = data?.settings?.phoneNumbers || [];

  if (!isAuthenticated) {
    return (
      <AdminPin
        onAuthenticated={() => setIsAuthenticated(true)}
        onBackToSite={onBackToSite}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <span>{isRtl ? "لوحة تحكم أوتو ليد" : "AutoLedBlida Back-Office"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                PRO PIN
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {isRtl ? "إدارة المواعيد، المخزون وأرقام الهاتف" : "Gestion des rendez-vous, stock et téléphones"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold hover:text-white"
          >
            <Globe className="w-3.5 h-3.5 text-brand-red" />
            <span>{lang === "fr" ? "العربية" : "Français"}</span>
          </button>

          <button
            onClick={onBackToSite}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.admin.logout}</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "orders"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span>{t.admin.tabs.orders}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              orders.filter((o) => o.status === "nouveau").length > 0
                ? "bg-amber-500 text-black animate-pulse"
                : "bg-black/40 text-white"
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "appointments"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t.admin.tabs.appointments}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "products"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.admin.tabs.products}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("phones")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "phones"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>{t.admin.tabs.phones}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {phoneNumbers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "categories"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>{t.admin.tabs.categories}</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "settings"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.admin.tabs.settings}</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "stats"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.admin.tabs.stats}</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "phones" && <PhonesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "stats" && <StatsTab />}

      </div>
    </div>
  );
}