import React, { useState, useEffect } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { DataProvider } from "./context/DataContext";
import { Home } from "./pages/Home";
import { Admin } from "./pages/Admin";

export function App() {
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith("/admin") || window.location.hash === "#admin"
      ? "admin"
      : "home";
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setCurrentView("admin");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleOpenAdmin = () => {
    setCurrentView("admin");
    window.location.hash = "#admin";
  };

  const handleBackToSite = () => {
    setCurrentView("home");
    window.location.hash = "";
  };

  return (
    <LanguageProvider>
      <DataProvider>
        {currentView === "admin" ? (
          <Admin onBackToSite={handleBackToSite} />
        ) : (
          <Home onOpenAdmin={handleOpenAdmin} />
        )}
      </DataProvider>
    </LanguageProvider>
  );
}

export default App;