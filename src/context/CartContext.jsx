import { useState } from "react";
import { CartCtx } from "./cartStore.js";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState("");
  const [switchRequest, setSwitchRequest] = useState(null);

  const addItem = (item, vendor) => {
    if (vendorId && vendorId !== vendor.id) {
      setSwitchRequest({ item, vendor, fromVendorName: vendorName });
      return false;
    }
    if (vendor.id) {
      setVendorId(vendor.id);
      setVendorName(vendor.name);
    }
    setItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    return true;
  };

  const confirmSwitch = () => {
    if (!switchRequest) return;
    const { item, vendor } = switchRequest;
    setItems([{ ...item, qty: 1 }]);
    setVendorId(vendor.id || null);
    setVendorName(vendor.name || "");
    setSwitchRequest(null);
  };

  const cancelSwitch = () => setSwitchRequest(null);

  const removeItem = (itemId) => {
    setItems(prev => {
      const updated = prev
        .map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0);
      if (updated.length === 0) setVendorId(null);
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
    setVendorName("");
  };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const getQty = (id) => items.find(i => i.id === id)?.qty || 0;

  return (
    <CartCtx.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      total,
      count,
      getQty,
      vendorName,
      vendorId,
      switchRequest,
      confirmSwitch,
      cancelSwitch,
    }}>
      {children}
    </CartCtx.Provider>
  );
}
