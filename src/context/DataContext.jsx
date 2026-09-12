import React, { createContext, useContext, useState, useEffect } from "react";

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
      setData(json);
      localStorage.setItem("autoled_cache", JSON.stringify(json));
      setError(null);
    } catch (err) {
      console.warn("Backend not reached, using local cache / defaults:", err);
      const cached = localStorage.getItem("autoled_cache");
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch {
          // ignore
        }
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

  // 2. Admin: Verify PIN
  const verifyPin = async (pin) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        const json = await res.json();
        return json.success;
      }
    } catch {
      // Local fallback check
      const currentPin = data?.settings?.adminPin || "1234";
      return pin === currentPin;
    }
    const currentPin = data?.settings?.adminPin || "1234";
    return pin === currentPin;
  };

  // 3. Admin: Change PIN
  const changePin = async (oldPin, newPin) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/change-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin })
      });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, adminPin: newPin }
        }));
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch {
      setData((prev) => ({
        ...prev,
        settings: { ...prev.settings, adminPin: newPin }
      }));
      return { success: true };
    }
  };

  // 4. Admin: Update settings (banner, hours, etc.)
  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneData)
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, phoneNumbers: json.phoneNumbers }
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline phone save", e);
    }

    // Local fallback
    setData((prev) => {
      let phones = [...(prev.settings.phoneNumbers || [])];
      if (phoneData.id) {
        phones = phones.map((p) => (p.id === phoneData.id ? { ...p, ...phoneData } : p));
      } else {
        phones.push({
          id: "p-" + Date.now(),
          ...phoneData
        });
      }
      if (phoneData.isPrimary) {
        phones = phones.map((p) => ({
          ...p,
          isPrimary: p.number === phoneData.number
        }));
        prev.settings.whatsappMain = phoneData.number;
      }
      const updated = {
        ...prev,
        settings: { ...prev.settings, phoneNumbers: phones }
      };
      localStorage.setItem("autoled_cache", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const deletePhone = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/phones/${id}`, { method: "DELETE" });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, phoneNumbers: json.phoneNumbers }
        }));
        return { success: true };
      }
    } catch (e) {
      console.warn("Offline phone delete", e);
    }

    setData((prev) => {
      const phones = (prev.settings.phoneNumbers || []).filter((p) => p.id !== id);
      const updated = {
        ...prev,
        settings: { ...prev.settings, phoneNumbers: phones }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });
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
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData)
      });
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
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
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
      const res = await fetch(`${API_BASE}/api/admin/appointments/${id}`, { method: "DELETE" });
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
    const fallbackOrder = {
      id: "cmd-" + Date.now(),
      ...orderData,
      quantity: qty,
      total: price * qty,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
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
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, { method: "DELETE" });
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

  const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          const res = await fetch(`${API_BASE}/api/admin/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, filename: file.name })
          });
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
        createAppointment,
        verifyPin,
        changePin,
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
        updateOrderStatus,
        deleteOrder
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}