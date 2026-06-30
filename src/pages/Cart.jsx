import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { ordersApi, paymentsApi } from "../api/index.js";
import { useAccount } from "../context/AccountContext.jsx";
import SuccessModal from "../components/SuccessModal.jsx";
import { theme } from "../styles/theme.js";

const MAPBOX_TOKEN    = import.meta.env.VITE_MAPBOX_TOKEN;
const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// ── Loaders ───────────────────────────────────────────────────────────────────
function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(window.Stripe); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = () => resolve(window.Stripe);
    s.onerror = () => reject(new Error("Could not load Stripe.js"));
    document.head.appendChild(s);
  });
}

function loadMapbox() {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) { resolve(window.mapboxgl); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    s.onload = () => resolve(window.mapboxgl);
    s.onerror = () => reject(new Error("Could not load map"));
    document.head.appendChild(s);
  });
}

// ── Mapbox address picker ─────────────────────────────────────────────────────
function AddressPicker({ initialAddress, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const debounceRef  = useRef(null);
  const [query,     setQuery]     = useState(initialAddress || "");
  const [results,   setResults]   = useState([]);
  const [coords,    setCoords]    = useState(null);
  const [addrLine,  setAddrLine]  = useState(initialAddress || "");
  const [searching, setSearching] = useState(false);
  const [mapReady,  setMapReady]  = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let mounted = true;
    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/streets-v12", center: [36.817, -1.286], zoom: 13 });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      const marker = new mapboxgl.Marker({ color: theme.colors.brand, draggable: true }).setLngLat([36.817, -1.286]).addTo(map);

      const revGeocode = async (lng, lat) => {
        try {
          const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
          const d = await r.json();
          return d.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
      };

      marker.on("dragend", async () => {
        const { lng, lat } = marker.getLngLat();
        setCoords({ lat, lng });
        const p = await revGeocode(lng, lat);
        setAddrLine(p); setQuery(p);
      });
      map.on("click", async e => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        setCoords({ lat, lng });
        const p = await revGeocode(lng, lat);
        setAddrLine(p); setQuery(p);
      });
      mapRef.current = map; markerRef.current = marker;
      navigator.geolocation?.getCurrentPosition(pos => {
        if (!mounted) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        map.flyTo({ center: [lng, lat], zoom: 15 });
        marker.setLngLat([lng, lat]); setCoords({ lat, lng });
        revGeocode(lng, lat).then(p => { if (!initialAddress) { setAddrLine(p); setQuery(p); } });
      }, () => {}, { timeout: 5000 });
      map.on("load", () => { if (mounted) setMapReady(true); });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const search = val => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,poi`);
        const d = await r.json();
        setResults(d.features || []);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 350);
  };

  const selectResult = f => {
    const [lng, lat] = f.center;
    setQuery(f.place_name); setAddrLine(f.place_name); setResults([]); setCoords({ lat, lng });
    if (mapRef.current && markerRef.current) { mapRef.current.flyTo({ center: [lng, lat], zoom: 16 }); markerRef.current.setLngLat([lng, lat]); }
  };

  if (!MAPBOX_TOKEN) return (
    <div>
      <input className="pv2-input" placeholder="Enter delivery address…" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 12 }} autoFocus />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onConfirm({ address: query, lat: null, lng: null })} style={{ flex: 1, background: theme.colors.brand, border: "none", borderRadius: 12, padding: 13, color: "white", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Use this address</button>
        <button onClick={onCancel} style={{ background: "none", border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: theme.colors.textMuted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <input className="pv2-input" placeholder="Search your delivery address…" value={query} onChange={e => search(e.target.value)} style={{ paddingRight: 36 }} autoFocus />
        {searching && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>⏳</span>}
        {results.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden", border: `1px solid ${theme.colors.border}` }}>
            {results.map(f => (
              <button key={f.id} onClick={() => selectResult(f)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "11px 14px", fontSize: 13, color: theme.colors.textMain, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", borderBottom: `1px solid ${theme.colors.border}`, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
                <span style={{ lineHeight: 1.4 }}>{f.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ height: 220, borderRadius: 14, overflow: "hidden", border: `1.5px solid ${theme.colors.border}` }} />
        {!mapReady && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: theme.colors.bgField, borderRadius: 14, fontSize: 13, color: theme.colors.textMuted }}>Loading map…</div>}
      </div>
      <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: 0 }}>🗺️ Tap the map or drag the pin to fine-tune your location</p>
      {addrLine && (
        <div style={{ background: theme.colors.bgField, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: theme.colors.textMain, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ lineHeight: 1.5 }}>{addrLine}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={() => coords && addrLine && onConfirm({ address: addrLine, lat: coords.lat, lng: coords.lng })} disabled={!coords || !addrLine.trim()}
          style={{ flex: 1, background: (!coords || !addrLine.trim()) ? theme.colors.border : theme.colors.brand, border: "none", borderRadius: 12, padding: 13, color: (!coords || !addrLine.trim()) ? theme.colors.textMuted : "white", fontWeight: 700, fontSize: 14, cursor: (!coords || !addrLine.trim()) ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Confirm Location
        </button>
        <button onClick={onCancel} style={{ background: "none", border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: theme.colors.textMuted, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Stripe card form ──────────────────────────────────────────────────────────
function StripeCardForm({ amount, onSuccess, onCancel }) {
  const cardRef = useRef(null); const elemRef = useRef(null); const stripeRef = useRef(null);
  const [ready, setReady] = useState(false); const [paying, setPaying] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    loadStripeJs().then(Stripe => {
      if (!mounted || !cardRef.current) return;
      const stripe = Stripe(PUBLISHABLE_KEY); const elements = stripe.elements();
      const card = elements.create("card", { style: { base: { fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: theme.colors.textMain, "::placeholder": { color: theme.colors.textMuted } }, invalid: { color: theme.colors.brand } }, hidePostalCode: true });
      card.mount(cardRef.current);
      card.on("ready", () => { if (mounted) setReady(true); });
      card.on("change", e => { if (mounted) setError(e.error?.message || ""); });
      stripeRef.current = stripe; elemRef.current = card;
    }).catch(e => setError(e.message));
    return () => { mounted = false; elemRef.current?.destroy(); };
  }, []);
  const pay = async () => {
    if (!stripeRef.current || !elemRef.current) return;
    setPaying(true); setError("");
    try {
      const { clientSecret } = await paymentsApi.createStripeIntent(amount);
      const { error: sErr, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, { payment_method: { card: elemRef.current } });
      if (sErr) { setError(sErr.message); setPaying(false); return; }
      if (paymentIntent.status === "succeeded") onSuccess(paymentIntent.id);
    } catch (e) { setError(e.message); setPaying(false); }
  };
  return (
    <div style={{ marginTop: 8 }}>
      <div ref={cardRef} style={{ border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: 14, background: theme.colors.bgField, minHeight: 46 }} />
      {!ready && !error && <p style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 6 }}>Loading card form…</p>}
      {error && <p style={{ fontSize: 12, color: theme.colors.brand, marginTop: 6 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={pay} disabled={paying || !ready} style={{ flex: 1, background: paying ? theme.colors.textMuted : theme.colors.textMain, border: "none", borderRadius: 12, padding: 13, color: "white", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: paying ? "not-allowed" : "pointer" }}>
          {paying ? "Processing…" : `Pay ${Math.round(amount).toLocaleString()} TSh`}
        </button>
        <button onClick={onCancel} disabled={paying} style={{ background: "none", border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: theme.colors.textMuted, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── ClickPesa mobile money form ───────────────────────────────────────────────
function ClickPesaForm({ amount, orderId, orderRef, onSuccess, onCancel, defaultPhone }) {
  const [phone,    setPhone]    = useState(defaultPhone || "");
  const [status,   setStatus]   = useState("idle"); 
  const [message,  setMessage]  = useState("");
  const [error,    setError]    = useState("");
  const pollRef = useRef(null);

  const startPush = async () => {
    if (!phone.trim()) { setError("Enter your mobile money phone number."); return; }
    setError(""); setStatus("pushing");
    try {
      const result = await paymentsApi.clickpesaPush({ orderId, amount, phoneNumber: phone.trim() });
      setMessage(result.message || "Check your phone for a payment prompt.");
      setStatus("waiting");
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusResult = await paymentsApi.clickpesaStatus(orderRef);
          if (statusResult.status === "SUCCESSFUL") {
            clearInterval(pollRef.current);
            setStatus("done");
            onSuccess();
          } else if (statusResult.status === "FAILED" || statusResult.status === "CANCELLED") {
            clearInterval(pollRef.current);
            setStatus("failed");
            setError("Payment was not completed. Please try again.");
          }
        } catch { /* keep polling */ }
        if (attempts >= 36) { 
          clearInterval(pollRef.current);
          setStatus("failed");
          setError("Payment timed out. If money was deducted, contact support.");
        }
      }, 5000);
    } catch (e) {
      setError(e.message); setStatus("idle");
    }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  if (status === "waiting" || status === "done") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{status === "done" ? "✅" : "📱"}</div>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{status === "done" ? "Payment confirmed!" : "Waiting for payment…"}</p>
      <p style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{message}</p>
      {status === "waiting" && (
        <>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: theme.colors.brand, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <button onClick={onCancel} style={{ background: "none", border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: "10px 20px", fontSize: 13, color: theme.colors.textMuted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
        </>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
        Enter your mobile money number (M-Pesa, Tigo, Airtel, Halo). You'll receive a prompt to enter your PIN.
      </p>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: theme.colors.textMuted, pointerEvents: "none" }}>📱</span>
        <input
          className="form-input"
          type="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
          placeholder="e.g. 0712 345 678 or +255712345678"
          style={{ paddingLeft: 36 }}
        />
      </div>
      {error && <p style={{ fontSize: 12, color: theme.colors.brand, marginBottom: 8 }}>{error}</p>}
      {status === "failed" && (
        <p style={{ fontSize: 12, color: theme.colors.brand, marginBottom: 8 }}>{error || "Payment failed. Try again."}</p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={startPush} disabled={status === "pushing"}
          style={{ flex: 1, background: status === "pushing" ? theme.colors.textMuted : theme.colors.brand, border: "none", borderRadius: 12, padding: 13, color: "white", fontWeight: 700, fontSize: 14, cursor: status === "pushing" ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          {status === "pushing" ? "Sending…" : `Pay TZS ${Math.round(amount).toLocaleString()}`}
        </button>
        <button onClick={onCancel} style={{ background: "none", border: `1.5px solid ${theme.colors.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: theme.colors.textMuted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Cancel
        </button>
      </div>
      <p style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
        🔒 Powered by ClickPesa · Supports M-Pesa, Tigo, Airtel & Halopesa
      </p>
    </div>
  );
}

// ── Pay methods ───────────────────────────────────────────────────────────────
const PAY_METHODS = [
  { id: "cash",   label: "Cash on Delivery",detail: "Pay when your order arrives",   emoji: "💵" },
  { id: "mobile", label: "Mobile Money",    detail: "M-Pesa · Tigo · Airtel · Halo", emoji: "📱" },
  { id: "card",   label: "Card",            detail: "Visa or Mastercard",            render: () => <div className="pm-card-icons"><span className="pm-mc" /><span className="pm-visa">VISA</span></div> },
];

// ── Main Cart ─────────────────────────────────────────────────────────────────
export default function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName, vendorId } = useCart();
  const { user } = useAccount();

  const [fulfillment,    setFulfillment]    = useState("delivery"); // "delivery" | "pickup"
  const [delivery,       setDelivery]       = useState({ address: "", lat: null, lng: null });
  const [showPicker,     setShowPicker]      = useState(false);
  const [payMethod,      setPayMethod]       = useState("cash");
  const [showCardForm,   setShowCardForm]    = useState(false);
  const [showMobileForm, setShowMobileForm]  = useState(false);
  const [pendingOrder,   setPendingOrder]    = useState(null); 
  const [placed,         setPlaced]          = useState(false);
  const [loading,        setLoading]         = useState(false);
  const [error,          setError]           = useState("");

  const deliveryFee     = (fulfillment === "delivery" && items.length > 0) ? 2000 : 0; 
  const grandTotal      = total + deliveryFee;
  const stripeAvailable = !!PUBLISHABLE_KEY;

  useEffect(() => {
    if (payMethod !== "card")   setShowCardForm(false);
    if (payMethod !== "mobile") setShowMobileForm(false);
  }, [payMethod]);

  const createOrder = async (paymentMethod) => {
    const cacheBuster = `?t=${Date.now()}`;
    const { order } = await ordersApi.place({
      vendorId,
      fulfillmentType: fulfillment,
      address:       fulfillment === "delivery" ? delivery.address : "Self Pick-up from Restaurant",
      deliveryLat:   fulfillment === "delivery" ? delivery.lat : null,
      deliveryLng:   fulfillment === "delivery" ? delivery.lng : null,
      paymentMethod,
      items: items.map(i => ({ menuItemId: i.id, qty: i.qty })),
    }, cacheBuster);
    return order;
  };

  const placeOrder = async () => {
    if (fulfillment === "delivery" && !delivery.address.trim()) { setError("Please set a delivery address."); return; }
    setError(""); setLoading(true);

    try {
      if (payMethod === "cash") {
        await createOrder("cash");
        setPlaced(true);
        return;
      }

      if (payMethod === "card" && stripeAvailable) {
        setLoading(false);
        setShowCardForm(true);
        return;
      }

      if (payMethod === "mobile") {
        const order = await createOrder("mobile");
        setPendingOrder({ id: order.id, ref: order.ref });
        setLoading(false);
        setShowMobileForm(true);
        return;
      }

      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleStripeSuccess = async (stripePaymentId) => {
    try {
      await createOrder("card");
      setPlaced(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const closeSuccess = () => { clearCart(); navigate("orders"); };

  if (items.length === 0 && !placed) return (
    <div style={theme.pwaContainer}>
      <div className="empty-cart" style={{ textAlign: "center", padding: "60px 0" }}>
        <span className="empty-cart-icon" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🛒</span>
        <h3 style={{ color: theme.colors.textMain, fontSize: 18, marginBottom: 8 }}>Your cart is empty</h3>
        <p style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 24 }}>Add some delicious food to get started</p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{ width: "auto", padding: "14px 32px", background: theme.colors.brand, color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>Browse Restaurants</button>
      </div>
    </div>
  );

  return (
    <div style={theme.pwaContainer}>
      <div style={{ paddingBottom: 40 }}>
        <div className="cart-vendor-label" style={{ display: "flex", alignItems: "center", gap: 4, background: theme.colors.bgField, padding: "12px 14px", borderRadius: 12, marginBottom: 20, color: theme.colors.textMain, fontSize: 14 }}>
          <span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong>
        </div>

        {/* Items */}
        <div className="cart-items" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {items.map(item => (
            <div key={item.id} className="cart-item" style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: 12 }}>
              <div className="cart-item-emoji" style={{ fontSize: 24 }}>{item.image}</div>
              <div className="cart-item-info" style={{ flex: 1 }}>
                <p className="cart-item-name" style={{ margin: 0, fontWeight: 600, color: theme.colors.textMain, fontSize: 14 }}>{item.name}</p>
                <p className="cart-item-price" style={{ margin: "2px 0 0", color: theme.colors.brand, fontSize: 13, fontWeight: 700 }}>{(item.price * item.qty).toLocaleString()} TSh</p>
              </div>
              <div className="qty-control" style={{ display: "flex", alignItems: "center", gap: 10, background: theme.colors.bgField, borderRadius: 20, padding: "4px 10px" }}>
                <button onClick={() => removeItem(item.id)} style={{ border: "none", background: "none", color: theme.colors.textMain, fontWeight: 700, cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ fontWeight: 600, fontSize: 13, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => addItem(item, { id: vendorId, name: vendorName })} style={{ border: "none", background: "none", color: theme.colors.textMain, fontWeight: 700, cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* New Fulfillment Option Segment */}
        <p className="cv2-section-title" style={{ fontWeight: 700, fontSize: 14, color: theme.colors.textMain, marginBottom: 10 }}>📦 Order Method</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, background: theme.colors.bgField, padding: 4, borderRadius: 12 }}>
          <button type="button" onClick={() => setFulfillment("delivery")} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: fulfillment === "delivery" ? "white" : "transparent", boxShadow: fulfillment === "delivery" ? "0 2px 6px rgba(0,0,0,0.06)" : "none", color: fulfillment === "delivery" ? theme.colors.brand : theme.colors.textMuted, transition: "0.2s" }}>
            🛵 Delivery
          </button>
          <button type="button" onClick={() => setFulfillment("pickup")} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: fulfillment === "pickup" ? "white" : "transparent", boxShadow: fulfillment === "pickup" ? "0 2px 6px rgba(0,0,0,0.06)" : "none", color: fulfillment === "pickup" ? theme.colors.brand : theme.colors.textMuted, transition: "0.2s" }}>
            🛍️ Self Pick-Up
          </button>
        </div>

        {/* Conditional Address Selection based on Option selection */}
        {fulfillment === "delivery" && (
          <>
            <p className="cv2-section-title" style={{ fontWeight: 700, fontSize: 14, color: theme.colors.textMain, marginBottom: 10 }}>📍 Delivery Address</p>
            {showPicker ? (
              <div style={{ marginBottom: 20 }}>
                <AddressPicker
                  initialAddress={delivery.address}
                  onConfirm={({ address, lat, lng }) => { setDelivery({ address, lat, lng }); setShowPicker(false); }}
                  onCancel={() => setShowPicker(false)}
                />
              </div>
            ) : (
              <button onClick={() => setShowPicker(true)}
                style={{ width: "100%", textAlign: "left", background: delivery.address ? theme.colors.bgField : "white", border: `1.5px solid ${delivery.address ? theme.colors.border : theme.colors.brand}`, borderRadius: 12, padding: "13px 14px", marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: delivery.address ? theme.colors.textMain : theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
                <span style={{ lineHeight: 1.5, flex: 1 }}>{delivery.address || "Tap to set your delivery location on the map…"}</span>
                <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 12, color: theme.colors.brand, fontWeight: 600 }}>{delivery.address ? "Change" : "Set"}</span>
              </button>
            )}
          </>
        )}

        {fulfillment === "pickup" && (
          <div style={{ padding: "14px", background: theme.colors.bgField, borderRadius: 12, border: `1.5px dashed ${theme.colors.border}`, marginBottom: 20, fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.5 }}>
            Store pickup is selected. Collect your package directly from <strong>{vendorName}</strong>. We'll update your feed with status changes when your kitchen flags it ready.
          </div>
        )}

        {/* Summary */}
        <p className="cv2-section-title" style={{ fontWeight: 700, fontSize: 14, color: theme.colors.textMain, marginBottom: 10 }}>Order summary</p>
        <div className="cv2-summary" style={{ background: theme.colors.bgField, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.colors.textMuted }}><span>Subtotal</span><span style={{ color: theme.colors.textMain }}>{total.toLocaleString()} TSh</span></div>
          {fulfillment === "delivery" && (
            <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.colors.textMuted }}><span>Delivery fee</span><span style={{ color: theme.colors.textMain }}>{deliveryFee.toLocaleString()} TSh</span></div>
          )}
          {fulfillment === "pickup" && (
            <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.colors.textMuted }}><span>Delivery fee</span><span style={{ color: "#16a34a", fontWeight: 600 }}>FREE</span></div>
          )}
          <div className="cv2-summary-divider" style={{ height: 1, background: theme.colors.border, margin: "4px 0" }} />
          <div className="cv2-summary-row cv2-summary-total" style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: theme.colors.textMain }}><span>Total</span><span style={{ color: theme.colors.brand }}>{grandTotal.toLocaleString()} TSh</span></div>
        </div>

        {/* Payment methods */}
        <p className="cv2-section-title" style={{ fontWeight: 700, fontSize: 14, color: theme.colors.textMain, marginBottom: 10 }}>Payment methods</p>
        <div className="cv2-pay-list" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PAY_METHODS.map(pm => (
            <button key={pm.id} className={`cv2-pay-opt ${payMethod === pm.id ? "active" : ""}`} onClick={() => setPayMethod(pm.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "white", border: `1.5px solid ${payMethod === pm.id ? theme.colors.brand : theme.colors.border}`, borderRadius: 14, padding: 14, textAlign: "left", cursor: "pointer", transition: "0.2s" }}>
              <div className="cv2-pay-icon" style={{ fontSize: 20 }}>{pm.render ? pm.render() : pm.emoji}</div>
              <div className="cv2-pay-text" style={{ flex: 1 }}>
                <span className="cv2-pay-label" style={{ display: "block", fontWeight: 600, fontSize: 14, color: theme.colors.textMain }}>{pm.label}{pm.id === "card" && !stripeAvailable ? " (setup required)" : ""}</span>
                <span className="cv2-pay-detail" style={{ display: "block", fontSize: 12, color: theme.colors.textMuted, marginTop: 1 }}>{pm.detail}</span>
              </div>
              <div className={`cv2-radio ${payMethod === pm.id ? "checked" : ""}`} style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${payMethod === pm.id ? theme.colors.brand : theme.colors.textMuted}`, display: "flex", alignItems: "center", justifyContent: "center", background: payMethod === pm.id ? theme.colors.brand : "transparent" }}>
                {payMethod === pm.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
              </div>
            </button>
          ))}
        </div>

        {/* Stripe form */}
        {payMethod === "card" && stripeAvailable && showCardForm && (
          <div style={{ marginTop: 14, background: theme.colors.bgField, border: `1.5px solid ${theme.colors.border}`, borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: theme.colors.textMain }}>Enter card details</p>
            <StripeCardForm amount={grandTotal} onSuccess={handleStripeSuccess} onCancel={() => setShowCardForm(false)} />
          </div>
        )}

        {payMethod === "card" && !stripeAvailable && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 10, fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.6 }}>
            💡 Card payments need <code style={{ background: theme.colors.border, borderRadius: 4, padding: "1px 5px" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> configured.
          </div>
        )}

        {/* ClickPesa mobile money form */}
        {payMethod === "mobile" && showMobileForm && pendingOrder && (
          <div style={{ marginTop: 14, background: theme.colors.bgField, border: `1.5px solid ${theme.colors.border}`, borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: theme.colors.textMain }}>Mobile Money Payment</p>
            <ClickPesaForm
              amount={grandTotal}
              orderId={pendingOrder.id}
              orderRef={pendingOrder.ref}
              defaultPhone={user?.phone || ""}
              onSuccess={() => { setPlaced(true); setShowMobileForm(false); }}
              onCancel={() => { setShowMobileForm(false); setPendingOrder(null); }}
            />
          </div>
        )}

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#991b1b" }}>
            {error}
          </div>
        )}
      </div>

      {/* Bottom sticky bar layout */}
      {!showCardForm && !showMobileForm && !showPicker && (
        <div className="cv2-bottom-bar" style={{ position: "fixed", bottom: "calc(var(--sab) + 68px)", left: 0, right: 0, background: "white", padding: "12px 16px", borderTop: `1px solid ${theme.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 90 }}>
          <div className="cv2-bottom-total" style={{ display: "flex", flexDirection: "column" }}>
            <span className="cv2-bottom-total-label" style={{ fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total amt</span>
            <span className="cv2-bottom-total-amount" style={{ fontSize: 18, fontWeight: 800, color: theme.colors.brand }}>{grandTotal.toLocaleString()} TSh</span>
          </div>
          <button className="cv2-pay-btn" onClick={placeOrder} disabled={loading || (fulfillment === "delivery" && !delivery.address)} style={{ background: (loading || (fulfillment === "delivery" && !delivery.address)) ? theme.colors.textMuted : theme.colors.brand, color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, fontSize: 14, cursor: (loading || (fulfillment === "delivery" && !delivery.address)) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? "Placing…" : "Pay Now"}
          </button>
        </div>
      )}

      {placed && (
        <SuccessModal
          title="Order placed! 🎉"
          message={`Your order has been placed with ${vendorName}. You'll be notified once it's accepted.`}
          buttonLabel="Track Order"
          onClose={closeSuccess}
        />
      )}
    </div>
  );
}