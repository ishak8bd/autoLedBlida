import React, { createContext, useContext, useState, useEffect } from "react";
import { getDefaultDeliveryFee, generateInitialDeliveryFees } from "../data/algeriaWilayasCommunes";

const DataContext = createContext();

const API_BASE = "";

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from backend with fallback
  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data`);
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const json = await res.json();
      if (!json.deliveryFees) {
        json.deliveryFees = generateInitialDeliveryFees();
      }
      setData(json);
      localStorage.setItem("autoled_cache", JSON.stringify(json));
      setError(null);
    } catch (err) {
      console.warn("Backend not reached, using local cache / defaults:", err);
      const cached = localStorage.getItem("autoled_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (!parsed.deliveryFees) {
            parsed.deliveryFees = generateInitialDeliveryFees();
          }
          setData(parsed);
        } catch {
          // ignore
        }
      } else {
        setData((prev) => prev || { deliveryFees: generateInitialDeliveryFees() });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Submit appointment
  const createAppointment = async (aptData) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aptData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.appointment) {
          setData((prev) => ({
            ...prev,
            appointments: [json.appointment, ...(prev?.appointments || [])]
          }));
        }
        return { success: true, appointment: json.appointment };
      }
    } catch (e) {
      console.warn("Offline fallback for appointment creation:", e);
    }

    // Local fallback
    const fallbackApt = {
      id: "apt-" + Date.now(),
      ...aptData,
      status: "nouveau",
      createdAt: new Date().toISOString()
    };
    setData((prev) => {
      const updated = {
        ...prev,
        appointments: [fallbackApt, ...(prev?.appointments || [])]
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true, appointment: fallbackApt };
  };

  // Token & Auth Header Management
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem("autoled_admin_token") || "";
  });

  const saveAdminToken = (token) => {
    if (token) {
      localStorage.setItem("autoled_admin_token", token);
      setAdminToken(token);
    } else {
      localStorage.removeItem("autoled_admin_token");
      setAdminToken("");
    }
  };

  const logoutAdmin = () => {
    saveAdminToken("");
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("autoled_admin_token") || adminToken;
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const verifyAdminToken = async () => {
    const token = localStorage.getItem("autoled_admin_token");
    if (!token) return { valid: false };
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify-token`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return { valid: true };
      }
      saveAdminToken("");
      return { valid: false };
    } catch {
      return { valid: Boolean(token) };
    }
  };

  // 2. Admin: Auth Status, Verify Password, Setup & Recovery
  const getAdminAuthStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth-status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Offline auth status check", e);
    }
    const isConfigured = Boolean(data?.settings?.adminAuth?.password);
    return {
      isConfigured,
      hasRecoveryPhone: Boolean(data?.settings?.adminAuth?.recoveryPhone)
    };
  };

  const verifyAdminPassword = async (password) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.token) saveAdminToken(json.token);
        return { success: true, token: json.token };
      }
      if (json.requiresSetup) {
        return { success: false, requiresSetup: true };
      }
      return { success: false, error: json.error || "Mot de passe incorrect" };
    } catch {
      // Local fallback
      const storedAuth = data?.settings?.adminAuth;
      if (!storedAuth?.password) {
        if (password === (data?.settings?.adminPin || "1234")) {
          return { success: true };
        }
        return { success: false, requiresSetup: true };
      }
      if (password === storedAuth.password) {
        return { success: true };
      }
      return { success: false, error: "Mot de passe incorrect" };
    }
  };

  const setupAdminCredentials = async ({ email, recoverySecret, emailPassword, phone, password }) => {
    const finalSecret = recoverySecret || emailPassword;
    try {
      const res = await fetch(`${API_BASE}/api/admin/setup-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoverySecret: finalSecret, phone, password })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.token) saveAdminToken(json.token);
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            adminPin: password,
            adminAuth: {
              recoveryEmail: email.trim().toLowerCase(),
              recoverySecret: finalSecret,
              hasRecoverySecret: true,
              recoveryPhone: (phone || "").trim(),
              password
            }
          }
        }));
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || "Erreur lors de la configuration" };
    } catch {
      // Local fallback
      setData((prev) => {
        const updated = {
          ...prev,
          settings: {
            ...prev.settings,
            adminPin: password,
            adminAuth: {
              recoveryEmail: email.trim().toLowerCase(),
              recoverySecret: finalSecret,
              hasRecoverySecret: true,
              recoveryPhone: (phone || "").trim(),
              password
            }
          }
        };
        localStorage.setItem("autoled_cache", JSON.stringify(updated));
        return updated;
      });
      return { success: true };
    }
  };

  const sendResetOtp = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/send-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      return json;
    } catch {
      return {
        success: false,
        canUseFallback: true,
        error: "Erreur de connexion lors de l'envoi de l'email. Vous pouvez utiliser l'Option B (clé de secours)."
      };
    }
  };

  const checkResetOtp = async ({ email, otp }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/check-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message, resetToken: json.resetToken };
      }
      return { success: false, error: json.error || "Code incorrect" };
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  };

  const verifyResetOtp = async ({ email, otp, resetToken, newPassword }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, resetToken, newPassword })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.token) saveAdminToken(json.token);
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            adminPin: newPassword,
            adminAuth: {
              ...prev.settings?.adminAuth,
              password: newPassword
            }
          }
        }));
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || "Code incorrect" };
    } catch {
      return { success: false, error: "Erreur réseau. Utilisez l'Option B (clé de secours)." };
    }
  };

  const checkFallbackCredentials = async ({ recoveryEmail, recoverySecret, recoveryEmailPassword }) => {
    const finalSecret = recoverySecret || recoveryEmailPassword;
    try {
      const res = await fetch(`${API_BASE}/api/admin/check-fallback-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail, recoverySecret: finalSecret })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message, fallbackToken: json.fallbackToken };
      }
      return { success: false, error: json.error || "Code de récupération incorrect" };
    } catch {
      // Local fallback check
      const stored = data?.settings?.adminAuth;
      if (!stored) {
        return { success: false, error: "Aucun profil d'authentification configuré." };
      }
      if (stored.recoveryEmail?.trim().toLowerCase() !== recoveryEmail?.trim().toLowerCase()) {
        return { success: false, error: "Adresse Gmail incorrecte ou non reconnue." };
      }
      const storedSecret = stored.recoverySecret || stored.recoveryEmailPassword;
      if (storedSecret !== finalSecret) {
        return { success: false, error: "Code de récupération incorrect." };
      }
      return { success: true, message: "Code de récupération validé !" };
    }
  };

  const recoverAdminPassword = async ({ fallbackToken, recoveryEmail, recoverySecret, recoveryEmailPassword, recoveryPhone, newPassword }) => {
    const finalSecret = recoverySecret || recoveryEmailPassword;
    try {
      const res = await fetch(`${API_BASE}/api/admin/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackToken, recoveryEmail, recoverySecret: finalSecret, recoveryPhone, newPassword })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.token) saveAdminToken(json.token);
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            adminPin: newPassword,
            adminAuth: {
              ...prev.settings?.adminAuth,
              password: newPassword
            }
          }
        }));
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || "Informations de récupération incorrectes" };
    } catch {
      // Local fallback check
      const stored = data?.settings?.adminAuth;
      if (!stored) {
        return { success: false, error: "Aucun profil d'authentification configuré." };
      }
      if (stored.recoveryEmail?.trim().toLowerCase() !== recoveryEmail?.trim().toLowerCase()) {
        return { success: false, error: "Adresse Gmail incorrecte ou non reconnue." };
      }
      const storedSecret = stored.recoverySecret || stored.recoveryEmailPassword;
      if (storedSecret !== finalSecret) {
        return { success: false, error: "Code de récupération incorrect." };
      }
      setData((prev) => {
        const updated = {
          ...prev,
          settings: {
            ...prev.settings,
            adminPin: newPassword,
            adminAuth: {
              ...prev.settings?.adminAuth,
              password: newPassword
            }
          }
        };
        localStorage.setItem("autoled_cache", JSON.stringify(updated));
        return updated;
      });
      return { success: true };
    }
  };

  const changeAdminCredentials = async ({ currentPassword, newPassword, recoveryEmail, recoverySecret, recoveryEmailPassword, recoveryPhone }) => {
    const finalSecret = recoverySecret || recoveryEmailPassword;
    try {
      const res = await fetch(`${API_BASE}/api/admin/change-credentials`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword, recoveryEmail, recoverySecret: finalSecret, recoveryPhone })
      });
      if (res.status === 401) saveAdminToken("");
      const json = await res.json();
      if (res.ok && json.success) {
        setData((prev) => {
          const updatedAuth = {
            ...prev.settings?.adminAuth,
            ...(newPassword ? { password: newPassword } : {}),
            ...(recoveryEmail ? { recoveryEmail: recoveryEmail.trim().toLowerCase() } : {}),
            ...(finalSecret ? { recoverySecret: finalSecret, hasRecoverySecret: true, hasRecoveryEmailPassword: true } : {}),
            ...(recoveryPhone !== undefined ? { recoveryPhone: (recoveryPhone || "").trim() } : {})
          };
          return {
            ...prev,
            settings: {
              ...prev.settings,
              ...(newPassword ? { adminPin: newPassword } : {}),
              adminAuth: updatedAuth
            }
          };
        });
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || "Erreur de mise à jour" };
    } catch {
      setData((prev) => {
        const updatedAuth = {
          ...prev.settings?.adminAuth,
          ...(newPassword ? { password: newPassword } : {}),
          ...(recoveryEmail ? { recoveryEmail: recoveryEmail.trim().toLowerCase() } : {}),
          ...(finalSecret ? { recoverySecret: finalSecret, hasRecoverySecret: true, hasRecoveryEmailPassword: true } : {}),
          ...(recoveryPhone !== undefined ? { recoveryPhone: (recoveryPhone || "").trim() } : {})
        };
        const updated = {
          ...prev,
          settings: {
            ...prev.settings,
            ...(newPassword ? { adminPin: newPassword } : {}),
            adminAuth: updatedAuth
          }
        };
        localStorage.setItem("autoled_cache", JSON.stringify(updated));
        return updated;
      });
      return { success: true };
    }
  };

  const getUptimeRobotStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/uptimerobot/status`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { configured: false, error: "Erreur de connexion" };
    }
  };

  const toggleUptimeRobot = async (monitorId, active) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/uptimerobot/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ monitorId, active })
      });
      return await res.json();
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  };

  // Backwards compatibility alias for PIN
  const verifyPin = async (pin) => {
    const res = await verifyAdminPassword(pin);
    return res.success;
  };

  const changePin = async (oldPin, newPin) => {
    return await changeAdminCredentials({ currentPassword: oldPin, newPassword: newPin });
  };

  // 4. Admin: Update settings (banner, hours, etc.)
  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({ ...prev, settings: json.settings }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline settings save", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 5. Admin: Save or Add Phone Number
  const savePhone = async (phoneData) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/phones`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(phoneData)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        const cleanPhones = Array.isArray(json.phoneNumbers)
          ? json.phoneNumbers.map((p) => ({
              id: p.id,
              number: String(p.number || "").trim(),
              labelFr: p.labelFr || "",
              labelAr: p.labelAr || "",
              isPrimary: Boolean(p.isPrimary),
              whatsapp: Boolean(p.whatsapp)
            }))
          : [];
        setData((prev) => {
          const updated = {
            ...prev,
            settings: {
              ...prev.settings,
              phoneNumbers: cleanPhones,
              whatsappMain: json.whatsappMain || prev.settings?.whatsappMain
            }
          };
          try {
            localStorage.setItem("autoled_cache", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline phone save", e);
    }

    // Local fallback
    setData((prev) => {
      let phones = [...(prev.settings.phoneNumbers || [])];
      const targetId = phoneData.id || ("p-" + Date.now());
      if (phoneData.id) {
        phones = phones.map((p) => (p.id === phoneData.id ? { ...p, ...phoneData } : p));
      } else {
        phones.push({
          id: targetId,
          ...phoneData
        });
      }
      if (phoneData.isPrimary) {
        phones = phones.map((p) => ({
          ...p,
          isPrimary: p.id === targetId
        }));
      } else if (!phones.some((p) => p.isPrimary) && phones.length > 0) {
        phones[0].isPrimary = true;
      }
      const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          phoneNumbers: phones,
          whatsappMain: primaryPhone ? primaryPhone.number : prev.settings?.whatsappMain
        }
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deletePhone = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/phones/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        const cleanPhones = Array.isArray(json.phoneNumbers)
          ? json.phoneNumbers.map((p) => ({
              id: p.id,
              number: String(p.number || "").trim(),
              labelFr: p.labelFr || "",
              labelAr: p.labelAr || "",
              isPrimary: Boolean(p.isPrimary),
              whatsapp: Boolean(p.whatsapp)
            }))
          : [];
        setData((prev) => {
          const updated = {
            ...prev,
            settings: {
              ...prev.settings,
              phoneNumbers: cleanPhones,
              whatsappMain: json.whatsappMain || prev.settings?.whatsappMain
            }
          };
          try {
            localStorage.setItem("autoled_cache", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline phone delete", e);
    }

    setData((prev) => {
      let phones = (prev.settings.phoneNumbers || []).filter((p) => p.id !== id);
      if (phones.length > 0 && !phones.some((p) => p.isPrimary)) {
        phones[0].isPrimary = true;
      }
      const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          phoneNumbers: phones,
          whatsappMain: primaryPhone ? primaryPhone.number : prev.settings?.whatsappMain
        }
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 6. Admin: Product CRUD
  const saveProduct = async (productData) => {
    const isEdit = Boolean(productData.id);
    const url = isEdit
      ? `${API_BASE}/api/admin/products/${productData.id}`
      : `${API_BASE}/api/admin/products`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        setData((prev) => {
          let prods = [...(prev.products || [])];
          if (isEdit) {
            prods = prods.map((p) => (p.id === productData.id ? json.product : p));
          } else {
            prods = [json.product, ...prods];
          }
          return { ...prev, products: prods };
        });
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline product save", e);
    }

    // Local fallback
    setData((prev) => {
      let prods = [...(prev.products || [])];
      if (isEdit) {
        prods = prods.map((p) => (p.id === productData.id ? { ...p, ...productData } : p));
      } else {
        const newP = { id: "prod-" + Date.now(), ...productData };
        prods = [newP, ...prods];
      }
      const updated = { ...prev, products: prods };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p.id !== id)
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline product delete", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        products: prev.products.filter((p) => p.id !== id)
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 7. Admin: Category CRUD
  const saveCategory = async (catData) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(catData)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({
          ...prev,
          categories: [...(prev.categories || []), json.category]
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline category save", e);
    }
    setData((prev) => {
      const newCat = {
        id: "cat-" + Date.now(),
        ...catData,
        count: 0
      };
      const updated = {
        ...prev,
        categories: [...(prev.categories || []), newCat]
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id)
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline category delete", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id)
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 8. Admin: Appointment Status & Deletion
  const updateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/appointments/${id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a))
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline appointment status update", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a))
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/appointments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          appointments: prev.appointments.filter((a) => a.id !== id)
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline appointment delete", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        appointments: prev.appointments.filter((a) => a.id !== id)
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 8b. Admin: Save / Edit Appointment
  const saveAppointment = async (aptData) => {
    const isEdit = Boolean(aptData.id);
    const url = isEdit
      ? `${API_BASE}/api/admin/appointments/${aptData.id}`
      : `${API_BASE}/api/admin/appointments`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(aptData)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        const savedApt = json.appointment;
        setData((prev) => {
          let appointments = prev.appointments || [];
          if (isEdit) {
            appointments = appointments.map((a) => (a.id === savedApt.id ? savedApt : a));
          } else {
            appointments = [savedApt, ...appointments];
          }
          return { ...prev, appointments };
        });
        return { success: true, appointment: savedApt };
      }
    } catch (e) {
      console.warn("Offline appointment save", e);
    }

    // Local fallback
    const targetId = aptData.id || ("apt-" + Date.now());
    const fallbackApt = {
      ...aptData,
      id: targetId,
      status: aptData.status || "nouveau",
      createdAt: aptData.createdAt || new Date().toISOString()
    };
    setData((prev) => {
      let appointments = [...(prev.appointments || [])];
      if (isEdit) {
        appointments = appointments.map((a) => (a.id === targetId ? fallbackApt : a));
      } else {
        appointments = [fallbackApt, ...appointments];
      }
      const updated = { ...prev, appointments };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true, appointment: fallbackApt };
  };

  // 9. Client: Submit Order
  const createOrder = async (orderData) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.order) {
          setData((prev) => ({
            ...prev,
            orders: [json.order, ...(prev?.orders || [])]
          }));
        }
        return { success: true, order: json.order };
      }
    } catch (e) {
      console.warn("Offline fallback for order creation:", e);
    }

    // Local fallback
    const qty = Math.max(1, Number(orderData.quantity) || 1);
    const price = Number(orderData.productPrice) || 0;
    const subtotal = price * qty;
    const dFee = Number(orderData.deliveryFee) || 0;
    const fallbackOrder = {
      id: "cmd-" + Date.now(),
      ...orderData,
      quantity: qty,
      subtotal,
      deliveryType: orderData.deliveryType || "home",
      deliveryFee: dFee,
      total: orderData.total !== undefined ? Number(orderData.total) : (subtotal + dFee),
      status: "nouveau",
      createdAt: new Date().toISOString()
    };
    setData((prev) => {
      const updated = {
        ...prev,
        orders: [fallbackOrder, ...(prev?.orders || [])]
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true, order: fallbackOrder };
  };

  // 10. Admin: Order Status & Deletion
  const updateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          orders: (prev.orders || []).map((o) => (o.id === id ? { ...o, status } : o))
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline order status update", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        orders: (prev.orders || []).map((o) => (o.id === id ? { ...o, status } : o))
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deleteOrder = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          orders: (prev.orders || []).filter((o) => o.id !== id)
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline order delete", e);
    }
    setData((prev) => {
      const updated = {
        ...prev,
        orders: (prev.orders || []).filter((o) => o.id !== id)
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  // 10b. Admin: Save / Edit Order
  const saveOrder = async (orderData) => {
    const isEdit = Boolean(orderData.id);
    const url = isEdit
      ? `${API_BASE}/api/admin/orders/${orderData.id}`
      : `${API_BASE}/api/admin/orders`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        const savedOrder = json.order;
        setData((prev) => {
          let orders = prev.orders || [];
          if (isEdit) {
            orders = orders.map((o) => (o.id === savedOrder.id ? savedOrder : o));
          } else {
            orders = [savedOrder, ...orders];
          }
          return { ...prev, orders };
        });
        return { success: true, order: savedOrder };
      }
    } catch (e) {
      console.warn("Offline order save", e);
    }

    // Local fallback
    const targetId = orderData.id || ("cmd-" + Date.now());
    const qty = Math.max(1, Number(orderData.quantity) || 1);
    const price = Number(orderData.productPrice) || 0;
    const fallbackOrder = {
      ...orderData,
      id: targetId,
      quantity: qty,
      productPrice: price,
      total: orderData.total !== undefined ? Number(orderData.total) : (price * qty),
      status: orderData.status || "nouveau",
      createdAt: orderData.createdAt || new Date().toISOString()
    };
    setData((prev) => {
      let orders = [...(prev.orders || [])];
      if (isEdit) {
        orders = orders.map((o) => (o.id === targetId ? fallbackOrder : o));
      } else {
        orders = [fallbackOrder, ...orders];
      }
      const updated = { ...prev, orders };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true, order: fallbackOrder };
  };

  // 11. Admin: Delivery Fees Management (Bureau & Maison per wilaya)
  const saveDeliveryFees = async (feesOrWilayaData) => {
    try {
      const isSingle = Boolean(feesOrWilayaData && feesOrWilayaData.wilaya);
      const body = isSingle ? feesOrWilayaData : { deliveryFees: feesOrWilayaData };
      const res = await fetch(`${API_BASE}/api/admin/delivery-fees`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      if (res.status === 401) saveAdminToken("");
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({
          ...prev,
          deliveryFees: json.deliveryFees
        }));
        return { success: true, deliveryFees: json.deliveryFees };
      }
    } catch (e) {
      console.warn("Offline delivery fees save", e);
    }

    // Local fallback
    setData((prev) => {
      let updatedFees = { ...(prev?.deliveryFees || generateInitialDeliveryFees()) };
      if (feesOrWilayaData && feesOrWilayaData.wilaya) {
        const { wilaya, home, desk, active } = feesOrWilayaData;
        updatedFees[wilaya] = {
          ...(updatedFees[wilaya] || {}),
          home: home !== undefined ? Number(home) : (updatedFees[wilaya]?.home ?? 700),
          desk: desk !== undefined ? Number(desk) : (updatedFees[wilaya]?.desk ?? 450),
          active: active !== undefined ? Boolean(active) : (updatedFees[wilaya]?.active ?? true)
        };
      } else if (feesOrWilayaData) {
        updatedFees = { ...updatedFees, ...feesOrWilayaData };
      }
      const updated = { ...prev, deliveryFees: updatedFees };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const getWilayaDeliveryFee = (wilayaName) => {
    if (!wilayaName) return { home: 700, desk: 450, active: true };
    const found = data?.deliveryFees?.[wilayaName];
    if (found) return found;
    if (data?.deliveryFees) {
      const key = Object.keys(data.deliveryFees).find((k) => k.includes(wilayaName) || wilayaName.includes(k));
      if (key && data.deliveryFees[key]) return data.deliveryFees[key];
    }
    return getDefaultDeliveryFee(wilayaName);
  };

  const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          const res = await fetch(`${API_BASE}/api/admin/upload`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ dataUrl, filename: file.name })
          });
          if (res.status === 401) saveAdminToken("");
          if (res.ok) {
            const json = await res.json();
            resolve(json.url);
            return;
          }
        } catch (e) {
          console.warn("Upload fallback to dataUrl", e);
        }
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        refresh: loadData,
        adminToken,
        logoutAdmin,
        verifyAdminToken,
        createAppointment,
        saveAppointment,
        verifyPin,
        changePin,
        getAdminAuthStatus,
        verifyAdminPassword,
        setupAdminCredentials,
        recoverAdminPassword,
        checkFallbackCredentials,
        sendResetOtp,
        checkResetOtp,
        verifyResetOtp,
        changeAdminCredentials,
        updateSettings,
        savePhone,
        deletePhone,
        saveProduct,
        deleteProduct,
        uploadImage,
        saveCategory,
        deleteCategory,
        updateAppointmentStatus,
        deleteAppointment,
        createOrder,
        saveOrder,
        updateOrderStatus,
        deleteOrder,
        deliveryFees: data?.deliveryFees || {},
        saveDeliveryFees,
        getWilayaDeliveryFee,
        getUptimeRobotStatus,
        toggleUptimeRobot
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}