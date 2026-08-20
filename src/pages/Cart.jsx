import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { ordersApi, paymentsApi } from "../api/index.js";
import { useAccount } from "../context/AccountContext.jsx";
import SuccessModal from "../components/SuccessModal.jsx";

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
  const [coords,     setCoords]    = useState(null);
  const [addrLine,   setAddrLine]  = useState(initialAddress || "");
  const [searching, setSearching] = useState(false);
  const [mapReady,   setMapReady]  = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let mounted = true;
    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/dark-v11", center: [36.817, -1.286], zoom: 13 });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      const marker = new mapboxgl.Marker({ color: "#e53935", draggable: true }).setLngLat([36.817, -1.286]).addTo(map);

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
      <input className="pv2-input" placeholder="Enter delivery address…" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: "12px", background: "#1a1a1a", border: "1px solid #222", color: "#fff" }} autoFocus />
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onConfirm({ address: query, lat: null, lng: null })} style={{ flex: 1, background: "#e53935", border: "none", borderRadius: "12px", padding: "13px", color: "white", fontWeight: 700, fontSize: "14px", fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>Use this address</button>
        <button onClick={onCancel} style={{ background: "none", border: "1.5px solid #222", borderRadius: "12px", padding: "13px 16px", fontSize: "13px", color: "#a0a0a0", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ position: "relative" }}>
        <input className="pv2-input" placeholder="Search your delivery address…" value={query} onChange={e => search(e.target.value)} style={{ paddingRight: "36px", background: "#1a1a1a", border: "1px solid #222", color: "#fff" }} autoFocus />
        {searching && <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>⏳</span>}
        {results.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#121212", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 10, overflow: "hidden", border: "1px solid #222" }}>
            {results.map(f => (
              <button key={f.id} onClick={() => selectResult(f)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "11px 14px", fontSize: "13px", color: "#ffffff", cursor: "pointer", fontFamily: "DM Sans,sans-serif", borderBottom: "1px solid #222", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ flexShrink: 0, marginTop: "1px" }}>📍</span>
                <span style={{ lineHeight: 1.4 }}>{f.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ height: "220px", borderRadius: "14px", overflow: "hidden", border: "1.5px solid #222" }} />
        {!mapReady && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", borderRadius: "14px", fontSize: "13px", color: "#a0a0a0" }}>Loading map…</div>}
      </div>
      <p style={{ fontSize: "12px", color: "#a0a0a0", margin: 0 }}>🗺️ Tap the map or drag the pin to fine-tune your location</p>
      {addrLine && (
        <div style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#ffffff", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ lineHeight: 1.5 }}>{addrLine}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button onClick={() => coords && addrLine && onConfirm({ address: addrLine, lat: coords.lat, lng: coords.lng })} disabled={!coords || !addrLine.trim()}
          style={{ flex: 1, background: (!coords || !addrLine.trim()) ? "#222" : "#e53935", border: "none", borderRadius: "12px", padding: "13px", color: (!coords || !addrLine.trim()) ? "#555" : "white", fontWeight: 700, fontSize: "14px", cursor: (!coords || !addrLine.trim()) ? "not-allowed" : "pointer", fontFamily: "DM Sans,sans-serif" }}>
          Confirm Location
        </button>
        <button onClick={onCancel} style={{ background: "none", border: "1.5px solid #222", borderRadius: "12px", padding: "13px 16px", fontSize: "13px", color: "#a0a0a0", fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>Cancel</button>
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
      const card = elements.create("card", { style: { base: { fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: "#ffffff", "::placeholder": { color: "#666666" } }, invalid: { color: "#ef4444" } }, hidePostalCode: true });
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
    <div style={{ marginTop: "8px" }}>
      <div ref={cardRef} style={{ border: "1.5px solid #222", borderRadius: "12px", padding: "14px", background: "#161616", minHeight: "46px" }} />
      {!ready && !error && <p style={{ fontSize: "12px", color: "#a0a0a0", marginTop: "6px" }}>Loading card form…</p>}
      {error && <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>{error}</p>}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button onClick={pay} disabled={paying || !ready} style={{ flex: 1, background: paying ? "#222" : "#e53935", border: "none", borderRadius: "12px", padding: "13px", color: "white", fontWeight: 700, fontSize: "14px", fontFamily: "'DM Sans',sans-serif", cursor: paying ? "not-allowed" : "pointer" }}>
          {paying ? "Processing…" : `Pay ${Math.round(amount).toLocaleString()} TSh`}
        </button>
        <button onClick={onCancel} disabled={paying} style={{ background: "none", border: "1.5px solid #222", borderRadius: "12px", padding: "13px 16px", fontSize: "13px", color: "#a0a0a0", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Snippe mobile money form ──────────────────────────────────────────────────
function SnippeForm({ amount, orderId, onSuccess, onCancel, defaultPhone }) {
  const [phone,    setPhone]    = useState(defaultPhone || "");
  const [status,   setStatus]   = useState("idle"); 
  const [message,   setMessage]  = useState("");
  const [error,    setError]    = useState("");
  const pollRef = useRef(null);

  const startPush = async () => {
    if (!phone.trim()) { setError("Enter your mobile money phone number."); return; }
    setError(""); setStatus("pushing");
    try {
      const result = await paymentsApi.snippePush({ orderId, amount, phoneNumber: phone.trim() });
      setMessage(result.message || "Check your phone for a payment prompt.");
      setStatus("waiting");
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusResult = await paymentsApi.snippeStatus(result.paymentReference);
          if (statusResult.status === "completed") {
            clearInterval(pollRef.current);
            setStatus("done");
            onSuccess();
          } else if (statusResult.status === "failed" || statusResult.status === "voided" || statusResult.status === "expired") {
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
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>{status === "done" ? "✅" : "📱"}</div>
      <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px", color: "#fff" }}>{status === "done" ? "Payment confirmed!" : "Waiting for payment…"}</p>
      <p style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: 1.6, marginBottom: "16px" }}>{message}</p>
      {status === "waiting" && (
        <>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e53935", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "1.5px solid #222", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", color: "#a0a0a0", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
            Cancel
          </button>
        </>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: "8px" }}>
      <p style={{ fontSize: "13px", color: "#a0a0a0", marginBottom: "12px", lineHeight: 1.6 }}>
        Enter your mobile money number (M-Pesa, Mixx by Yas, Airtel, Halotel). You'll receive a prompt to enter your PIN.
      </p>
      <div style={{ position: "relative", marginBottom: "8px" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#a0a0a0", pointerEvents: "none" }}>📱</span>
        <input
          className="form-input"
          type="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
          placeholder="e.g. 0712 345 678"
          style={{ paddingLeft: "36px", background: "#1a1a1a", border: "1px solid #222", color: "#fff" }}
        />
      </div>
      {error && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "8px" }}>{error}</p>}
      {status === "failed" && (
        <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "8px" }}>{error || "Payment failed. Try again."}</p>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button onClick={startPush} disabled={status === "pushing"}
          style={{ flex: 1, background: status === "pushing" ? "#222" : "#e53935", border: "none", borderRadius: "12px", padding: "13px", color: "white", fontWeight: 700, fontSize: "14px", cursor: status === "pushing" ? "not-allowed" : "pointer", fontFamily: "DM Sans,sans-serif" }}>
          {status === "pushing" ? "Sending…" : `Pay TZS ${Math.round(amount).toLocaleString()}`}
        </button>
        <button onClick={onCancel} style={{ background: "none", border: "1.5px solid #222", borderRadius: "12px", padding: "13px 16px", fontSize: "13px", color: "#a0a0a0", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
          Cancel
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "#666", marginTop: "10px", textAlign: "center", lineHeight: 1.5 }}>
        🔒 Powered by Snippe · Supports M-Pesa, Mixx by Yas, Airtel & Halotel
      </p>
    </div>
  );
}

// ── Pay methods ───────────────────────────────────────────────────────────────
const PAY_METHODS = [
  { id: "cash",   label: "Cash on Delivery",detail: "Pay when your order arrives",   emoji: "💵" },
  { id: "mobile", label: "Mobile Money",    detail: "M-Pesa · Mixx · Airtel · Halotel", emoji: "📱" },
  { id: "card",   label: "Card",            detail: "Visa or Mastercard",            render: () => <div className="pm-card-icons"><span className="pm-mc" /><span className="pm-visa" style={{ color: "#2563eb" }}>VISA</span></div> },
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
  const [loading,         setLoading]         = useState(false);
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
    <div className="page cart-page" style={{ background: "#000000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="empty-cart" style={{ textAlign: "center", color: "#fff" }}>
        <span className="empty-cart-icon" style={{ fontSize: "60px", marginBottom: "16px", display: "block" }}>🛒</span>
        <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Your cart is empty</h3>
        <p style={{ color: "#a0a0a0", fontSize: "14px", margin: "0 0 24px" }}>Add some delicious food to get started</p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{ width: "auto", padding: "14px 32px", background: "linear-gradient(135deg, #e53935, #b71c1c)", border: "none", borderRadius: "14px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Browse Restaurants</button>
      </div>
    </div>
  );

  return (
    <div 
      className="cart-v2" 
      style={{ 
        background: "#000000", 
        minHeight: "100vh", 
        color: "#ffffff", 
        padding: "0 16px 120px",
        /* Neutralizes the global main-content top padding on mobile */
        marginTop: "calc(-1 * (var(--nav-h) + var(--sat)))",
        paddingTop: "calc(var(--sat) + 12px)"
      }}
    >
      <div>
       {/* ── PREMIUM MY CART TOPBAR ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          
          {/* Symmetrical Left Spacer (Keeps title perfectly centered since arrow is gone) */}
          <div style={{ width: "42px", height: "42px" }} />

          {/* Clean "My Cart" Title (Center) */}
          <h1 style={{ 
            fontFamily: "var(--font-heading)", 
            fontSize: "20px", 
            fontWeight: "800", 
            margin: 0, 
            color: "#ffffff",
            letterSpacing: "-0.3px"
          }}>
            Cart
          </h1>

          {/* Home Button with Reddish Fill (Right) */}
          <button 
            onClick={() => navigate("home")} 
            style={{ 
              width: "42px", 
              height: "42px", 
              borderRadius: "50%", 
              background: "#1a1a1a", 
              border: "1px solid #222", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              color: "#e53935" /* Red accent line color */
            }}
            aria-label="Go to Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(229, 57, 53, 0.2)" stroke="currentColor" strokeWidth="2.5">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>

        {/* Ordering From Merchant Label */}
        <div 
          className="cart-vendor-label" 
          style={{ 
            background: "rgba(229,57,53,0.12)", 
            border: "1px solid rgba(229,57,53,0.2)", 
            borderRadius: 12, 
            padding: "20px 14px", 
            fontSize: "13px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "16px", 
            marginTop: "12px", 
            color: "#ffffff" 
          }}
        >
          <span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong>
        </div>
        {/* Items */}
        <div className="cart-items" style={{ background: "#121212", borderRadius: 14, overflow: "hidden", border: "1px solid #222", marginBottom: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
          {items.map(item => (
            <div key={item.id} className="cart-item" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1px solid #222" }}>
              <div className="cart-item-emoji" style={{ fontSize: "32px" }}>{item.image}</div>
              <div className="cart-item-info" style={{ flex: 1 }}>
                <p className="cart-item-name" style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 3px", color: "#fff" }}>{item.name}</p>
                <p className="cart-item-price" style={{ fontSize: "13px", color: "#e53935", fontWeight: 600, margin: 0 }}>{(item.price * item.qty).toLocaleString()} TSh</p>
              </div>
              <div className="qty-control" style={{ display: "flex", alignItems: "center", gap: "10px", background: "#000000", borderRadius: 10, padding: "6px 10px", border: "1px solid #222" }}>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "white", fontSize: "16px", cursor: "pointer" }}>−</button>
                <span style={{ color: "white", fontWeight: 700 }}>{item.qty}</span>
                <button onClick={() => addItem(item, { id: vendorId, name: vendorName })} style={{ background: "none", border: "none", color: "white", fontSize: "16px", cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* New Fulfillment Option Segment */}
        <p className="cv2-section-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "14px", color: "#ffffff", margin: "24px 0 10px" }}>📦 Order Method</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", background: "#121212", padding: "4px", borderRadius: 12, border: "1px solid #222" }}>
          <button type="button" onClick={() => setFulfillment("delivery")} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans", background: fulfillment === "delivery" ? "#e53935" : "transparent", boxShadow: fulfillment === "delivery" ? "0 2px 6px rgba(0,0,0,0.3)" : "none", color: fulfillment === "delivery" ? "#ffffff" : "#a0a0a0", transition: "0.2s" }}>
            🛵 Delivery
          </button>
          <button type="button" onClick={() => { setFulfillment("pickup"); setShowPicker(false); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "DM Sans", background: fulfillment === "pickup" ? "#e53935" : "transparent", boxShadow: fulfillment === "pickup" ? "0 2px 6px rgba(0,0,0,0.3)" : "none", color: fulfillment === "pickup" ? "#ffffff" : "#a0a0a0", transition: "0.2s" }}>
            🛍️ Self Pick-Up
          </button>
        </div>

        {/* Conditional Address Selection based on Option selection */}
        {fulfillment === "delivery" && (
          <>
            <p className="cv2-section-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "14px", color: "#ffffff", margin: "24px 0 10px" }}>📍 Delivery Address</p>
            {showPicker ? (
              <div style={{ marginBottom: "20px" }}>
                <AddressPicker
                  initialAddress={delivery.address}
                  onConfirm={({ address, lat, lng }) => { setDelivery({ address, lat, lng }); setShowPicker(false); }}
                  onCancel={() => setShowPicker(false)}
                />
              </div>
            ) : (
              <button onClick={() => setShowPicker(true)}
                style={{ width: "100%", textAlign: "left", background: "#121212", border: `1.5px solid ${delivery.address ? "#222" : "#e53935"}`, borderRadius: 12, padding: "13px 14px", marginBottom: "20px", fontFamily: "DM Sans,sans-serif", fontSize: "13px", color: delivery.address ? "#ffffff" : "#666", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                <span style={{ flexShrink: 0, marginTop: "1px" }}>📍</span>
                <span style={{ lineHeight: 1.5, flex: 1 }}>{delivery.address || "Tap to set your delivery location on the map…"}</span>
                <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: "12px", color: "#e53935", fontWeight: 600 }}>{delivery.address ? "Change" : "Set"}</span>
              </button>
            )}
          </>
        )}

        {fulfillment === "pickup" && (
          <div style={{ padding: "14px", background: "#121212", borderRadius: 12, border: "1.5px dashed #222", marginBottom: "20px", fontSize: "13px", color: "#a0a0a0", lineHeight: 1.5 }}>
            🏪 Collect your package directly from <strong style={{ color: "#fff" }}>{vendorName}</strong>. We'll update your feed with status changes when your kitchen flags it ready.
          </div>
        )}

        {/* Summary */}
        <p className="cv2-section-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "14px", color: "#ffffff", margin: "24px 0 10px" }}>Order summary</p>
        <div className="cv2-summary" style={{ background: "#121212", border: "1.5px solid #222", borderRadius: 14, padding: "14px 16px" }}>
          <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#a0a0a0", padding: "5px 0" }}><span>Subtotal</span><span style={{ color: "#fff" }}>{total.toLocaleString()} TSh</span></div>
          {fulfillment === "delivery" && (
            <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#a0a0a0", padding: "5px 0" }}><span>Delivery fee</span><span style={{ color: "#fff" }}>{deliveryFee.toLocaleString()} TSh</span></div>
          )}
          {fulfillment === "pickup" && (
            <div className="cv2-summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#a0a0a0", padding: "5px 0" }}><span>Delivery fee</span><span style={{ color: "#16a34a", fontWeight: 600 }}>FREE</span></div>
          )}
          <div className="cv2-summary-divider" style={{ height: "1px", background: "#222", margin: "6px 0" }} />
          <div className="cv2-summary-row cv2-summary-total" style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "16px", color: "#ffffff", paddingTop: "6px" }}><span>Total</span><span style={{ color: "#e53935" }}>{grandTotal.toLocaleString()} TSh</span></div>
        </div>

        {/* Payment methods */}
        <p className="cv2-section-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "14px", color: "#ffffff", margin: "24px 0 10px" }}>Payment methods</p>
        <div className="cv2-pay-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {PAY_METHODS.map(pm => (
            <button key={pm.id} className={`cv2-pay-opt ${payMethod === pm.id ? "active" : ""}`} onClick={() => setPayMethod(pm.id)} style={{ display: "flex", alignItems: "center", gap: "12px", background: payMethod === pm.id ? "rgba(229,57,53,0.12)" : "#121212", border: payMethod === pm.id ? "1.5px solid #e53935" : "1.5px solid #222", borderRadius: "14px", padding: "12px 14px", cursor: "pointer", width: "100%" }}>
              <div className="cv2-pay-icon" style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{pm.render ? pm.render() : pm.emoji}</div>
              <div className="cv2-pay-text" style={{ flex: 1, display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span className="cv2-pay-label" style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{pm.label}{pm.id === "card" && !stripeAvailable ? " (setup required)" : ""}</span>
                <span className="cv2-pay-detail" style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "1px" }}>{pm.detail}</span>
              </div>
              <div className={`cv2-radio ${payMethod === pm.id ? "checked" : ""}`} style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #333", flexShrink: 0, position: "relative", background: payMethod === pm.id ? "#e53935" : "transparent" }} />
            </button>
          ))}
        </div>

        {/* Stripe form */}
        {payMethod === "card" && stripeAvailable && showCardForm && (
          <div style={{ marginTop: "14px", background: "#121212", border: "1.5px solid #222", borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "#fff" }}>Enter card details</p>
            <StripeCardForm amount={grandTotal} onSuccess={handleStripeSuccess} onCancel={() => setShowCardForm(false)} />
          </div>
        )}

        {payMethod === "card" && !stripeAvailable && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "rgba(229,57,53,0.08)", border: "1.5px solid #3a1515", borderRadius: 10, fontSize: "12px", color: "#a0a0a0", lineHeight: 1.6 }}>
            💡 Card payments need <code style={{ background: "#222", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> configured.
          </div>
        )}

        {/* Snippe mobile money form */}
        {payMethod === "mobile" && showMobileForm && pendingOrder && (
          <div style={{ marginTop: "14px", background: "#121212", border: "1.5px solid #222", borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "#fff" }}>Mobile Money Payment</p>
            <SnippeForm
              amount={grandTotal}
              orderId={pendingOrder.id}
              defaultPhone={user?.phone || ""}
              onSuccess={() => { setPlaced(true); setShowMobileForm(false); }}
              onCancel={() => { setShowMobileForm(false); setPendingOrder(null); }}
            />
          </div>
        )}

        {error && (
          <div style={{ background: "#3a1515", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", marginTop: "14px", fontSize: "13px", color: "#fca5a5" }}>
            {error}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {!showCardForm && !showMobileForm && !showPicker && (
        <div className="cv2-bottom-bar" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "420px", boxSizing: "border-box", background: "#121212", borderTop: "1px solid #222", padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", zIndex: 90 }}>
          <div className="cv2-bottom-total" style={{ display: "flex", flexDirection: "column" }}>
            <span className="cv2-bottom-total-label" style={{ fontSize: "11px", color: "#a0a0a0" }}>Total amt</span>
            <span className="cv2-bottom-total-amount" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "18px", color: "#ffffff" }}>{grandTotal.toLocaleString()} TSh</span>
          </div>
          <button className="cv2-pay-btn" onClick={placeOrder} disabled={loading || (fulfillment === "delivery" && !delivery.address)} style={{ flex: 1, background: "#e53935", border: "none", borderRadius: 14, padding: "15px", color: "white", fontWeight: 700, fontSize: "15px", fontFamily: "var(--font-body)", cursor: (loading || (fulfillment === "delivery" && !delivery.address)) ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(229,57,53,0.3)" }}>
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