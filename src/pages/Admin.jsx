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
  Globe,
  Truck
} from "lucide-react";

import { AdminPin } from "./admin/AdminPin";
import { OrdersTab } from "./admin/OrdersTab";
import { AppointmentsTab } from "./admin/AppointmentsTab";
import { ProductsTab } from "./admin/ProductsTab";
import { PhonesTab } from "./admin/PhonesTab";
import { CategoriesTab } from "./admin/CategoriesTab";
import { SettingsTab } from "./admin/SettingsTab";
import { StatsTab } from "./admin/StatsTab";
import { DeliveryTab } from "./admin/DeliveryTab";

export function Admin({ onBackToSite }) {
  const { lang, toggleLang, isRtl, t } = useLanguage();
  const { data, logoutAdmin, adminToken } = useData();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  // If token is cleared (e.g. 401 response), lock admin session
  React.useEffect(() => {
    if (!adminToken && isAuthenticated) {
      setIsAuthenticated(false);
    }
  }, [adminToken, isAuthenticated]);

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

  const handleLogout = () => {
    if (logoutAdmin) logoutAdmin();
    setIsAuthenticated(false);
    onBackToSite();
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-brand-red shadow-glow-red bg-black shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg text-white">
              <span>{isRtl ? "لوحة تحكم أوتو ليد" : "AutoLedBlida Back-Office"}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {isRtl ? "إدارة المواعيد، المخزون وأرقام الهاتف" : "Gestion des rendez-vous, stock et téléphones"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher: FR for French, ض for Arabic */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-brand-red text-zinc-200 text-xs font-black transition-all"
            title={lang === "fr" ? "Changer de langue / تغيير اللغة (ض)" : "Changer de langue / تغيير اللغة (FR)"}
            aria-label="Changer de langue"
          >
            <Globe className="w-3.5 h-3.5 text-brand-red" />
            <span className="font-black text-xs uppercase">{lang === "fr" ? "FR" : "ض"}</span>
          </button>

          {/* Logout Button: Symbol only, no text */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
            title={t.admin.logout || "Quitter"}
            aria-label={t.admin.logout || "Quitter"}
          >
            <LogOut className="w-4 h-4" />
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
            onClick={() => setActiveTab("delivery")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "delivery"
                ? "bg-brand-red text-white shadow-glow-red"
                : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t.admin.tabs.delivery || (isRtl ? "أسعار التوصيل" : "Tarifs Livraison")}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              69
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
        {activeTab === "delivery" && <DeliveryTab />}
        {activeTab === "phones" && <PhonesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "stats" && <StatsTab />}

      </div>
    </div>
  );
}