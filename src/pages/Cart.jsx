import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { ordersApi, paymentsApi } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";

const MAPBOX_TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN;
const PUBLISHABLE_KEY  = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// ── Load helpers ──────────────────────────────────────────────────────────────
function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(window.Stripe); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload  = () => resolve(window.Stripe);
    s.onerror = () => reject(new Error("Could not load Stripe.js"));
    document.head.appendChild(s);
  });
}

function loadMapbox() {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) { resolve(window.mapboxgl); return; }
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    s.onload  = () => resolve(window.mapboxgl);
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

  const [query,    setQuery]    = useState(initialAddress || "");
  const [results,  setResults]  = useState([]);
  const [coords,   setCoords]   = useState(null);
  const [addrLine, setAddrLine] = useState(initialAddress || "");
  const [searching, setSearching] = useState(false);
  const [mapReady,  setMapReady]  = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let mounted = true;
    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [36.817, -1.286],
        zoom: 13,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      const marker = new mapboxgl.Marker({ color: "#e53935", draggable: true })
        .setLngLat([36.817, -1.286]).addTo(map);

      const reverseGeocode = async (lng, lat) => {
        try {
          const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
          const d = await r.json();
          return d.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
      };

      marker.on("dragend", async () => {
        const { lng, lat } = marker.getLngLat();
        setCoords({ lat, lng });
        const place = await reverseGeocode(lng, lat);
        setAddrLine(place); setQuery(place);
      });

      map.on("click", async (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        setCoords({ lat, lng });
        const place = await reverseGeocode(lng, lat);
        setAddrLine(place); setQuery(place);
      });

      mapRef.current    = map;
      markerRef.current = marker;

      navigator.geolocation?.getCurrentPosition(pos => {
        if (!mounted) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        map.flyTo({ center: [lng, lat], zoom: 15 });
        marker.setLngLat([lng, lat]);
        setCoords({ lat, lng });
        reverseGeocode(lng, lat).then(place => {
          if (!initialAddress) { setAddrLine(place); setQuery(place); }
        });
      }, () => {}, { timeout: 5000 });

      map.on("load", () => { if (mounted) setMapReady(true); });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const search = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,poi`);
        const d = await r.json();
        setResults(d.features || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  };

  const selectResult = (feature) => {
    const [lng, lat] = feature.center;
    setQuery(feature.place_name); setAddrLine(feature.place_name);
    setResults([]); setCoords({ lat, lng });
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div>
        <input className="pv2-input" placeholder="Enter delivery address…" value={query}
          onChange={e => setQuery(e.target.value)} style={{ marginBottom: 12 }} autoFocus />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onConfirm({ address: query, lat: null, lng: null })}
            style={{ flex: 1, background: "#e53935", border: "none", borderRadius: 12, padding: 13, color: "white", fontWeight: 700, fontSize: 14, fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>
            Use this address
          </button>
          <button onClick={onCancel}
            style={{ background: "none", border: "1.5px solid #e8e4df", borderRadius: 12, padding: "13px 16px", fontSize: 13, color: "#7a7065", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <input className="pv2-input" placeholder="Search your delivery address…" value={query}
          onChange={e => search(e.target.value)} style={{ paddingRight: 36 }} autoFocus />
        {searching && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>⏳</span>}
        {results.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden", border: "1px solid #e8e4df" }}>
            {results.map(f => (
              <button key={f.id} onClick={() => selectResult(f)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "11px 14px", fontSize: 13, color: "#0f0f0f", cursor: "pointer", fontFamily: "DM Sans,sans-serif", borderBottom: "1px solid #f0ede9", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
                <span style={{ lineHeight: 1.4 }}>{f.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ height: 220, borderRadius: 14, overflow: "hidden", border: "1.5px solid #e8e4df" }} />
        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f5f2", borderRadius: 14, fontSize: 13, color: "#b0a89f" }}>
            Loading map…
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#7a7065", margin: 0 }}>🗺️ Tap the map or drag the pin to fine-tune your location</p>

      {addrLine && (
        <div style={{ background: "#f7f5f2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#0f0f0f", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ lineHeight: 1.5 }}>{addrLine}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={() => coords && addrLine && onConfirm({ address: addrLine, lat: coords.lat, lng: coords.lng })}
          disabled={!coords || !addrLine.trim()}
          style={{ flex: 1, background: (!coords || !addrLine.trim()) ? "#e8e4df" : "#e53935", border: "none", borderRadius: 12, padding: 13, color: (!coords || !addrLine.trim()) ? "#b0a89f" : "white", fontWeight: 700, fontSize: 14, cursor: (!coords || !addrLine.trim()) ? "not-allowed" : "pointer", fontFamily: "DM Sans,sans-serif", transition: "background 0.2s" }}>
          Confirm Location
        </button>
        <button onClick={onCancel}
          style={{ background: "none", border: "1.5px solid #e8e4df", borderRadius: 12, padding: "13px 16px", fontSize: 13, color: "#7a7065", fontFamily: "DM Sans,sans-serif", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Stripe card form ──────────────────────────────────────────────────────────
function StripeCardForm({ amount, onSuccess, onCancel }) {
  const cardRef   = useRef(null);
  const elemRef   = useRef(null);
  const stripeRef = useRef(null);
  const [ready,  setReady]  = useState(false);
  const [paying, setPaying] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    let mounted = true;
    loadStripeJs().then(Stripe => {
      if (!mounted || !cardRef.current) return;
      const stripe   = Stripe(PUBLISHABLE_KEY);
      const elements = stripe.elements();
      const card     = elements.create("card", {
        style: { base: { fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: "#0f0f0f", "::placeholder": { color: "#b0a89f" } }, invalid: { color: "#ef4444" } },
        hidePostalCode: true,
      });
      card.mount(cardRef.current);
      card.on("ready",  () => { if (mounted) setReady(true); });
      card.on("change", e => { if (mounted) setError(e.error?.message || ""); });
      stripeRef.current = stripe;
      elemRef.current   = card;
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
      <div ref={cardRef} style={{ border: "1.5px solid #e8e4df", borderRadius: 12, padding: 14, background: "#fafaf9", minHeight: 46 }} />
      {!ready && !error && <p style={{ fontSize: 12, color: "#b0a89f", marginTop: 6 }}>Loading card form…</p>}
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={pay} disabled={paying || !ready}
          style={{ flex: 1, background: paying ? "#b0a89f" : "#0f0f0f", border: "none", borderRadius: 12, padding: 13, color: "white", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: paying ? "not-allowed" : "pointer" }}>
          {paying ? "Processing…" : `Pay $${Number(amount).toFixed(2)}`}
        </button>
        <button onClick={onCancel} disabled={paying}
          style={{ background: "none", border: "1.5px solid #e8e4df", borderRadius: 12, padding: "13px 16px", fontSize: 13, color: "#7a7065", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
      <p style={{ fontSize: 11, color: "#b0a89f", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
        🔒 Powered by Stripe · Your card details never touch our servers
      </p>
    </div>
  );
}

// ── Pay methods ───────────────────────────────────────────────────────────────
const PAY_METHODS = [
  {
    id: "card", label: "Card",
    detail: "Pay securely with Visa or Mastercard",
    render: () => <div className="pm-card-icons"><span className="pm-mc" /><span className="pm-visa">VISA</span></div>,
  },
  { id: "cash",   label: "Cash on Delivery", detail: "Pay when your order arrives",  emoji: "💵" },
  { id: "mobile", label: "Mobile Money",     detail: "M-Pesa, Tigo, Airtel & more", emoji: "📱" },
];

// ── Main Cart ─────────────────────────────────────────────────────────────────
export default function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName, vendorId } = useCart();

  // delivery = { address: string, lat: number|null, lng: number|null }
  const [delivery,     setDelivery]     = useState({ address: "", lat: null, lng: null });
  const [showPicker,   setShowPicker]   = useState(false);
  const [payMethod,    setPayMethod]    = useState("cash");
  const [showCardForm, setShowCardForm] = useState(false);
  const [placed,       setPlaced]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const deliveryFee     = items.length > 0 ? 2.00 : 0;
  const taxes           = items.length > 0 ? Math.round(total * 0.05 * 100) / 100 : 0;
  const grandTotal      = total + deliveryFee + taxes;
  const stripeAvailable = !!PUBLISHABLE_KEY;

  useEffect(() => { if (payMethod !== "card") setShowCardForm(false); }, [payMethod]);

  // ── Place order (cash / card after Stripe succeeds) ───────────────────────
  const submitOrder = async (stripePaymentId = null) => {
    if (!delivery.address.trim()) { setError("Please set a delivery address."); return; }
    setError(""); setLoading(true);
    try {
      await ordersApi.place({
        vendorId,
        address:        delivery.address,
        deliveryLat:    delivery.lat,
        deliveryLng:    delivery.lng,
        paymentMethod:  payMethod,
        stripePaymentId,
        items: items.map(i => ({ menuItemId: i.id, qty: i.qty })),
      });
      setPlaced(true);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!delivery.address.trim()) { setError("Please set a delivery address."); return; }
    setError("");

    // Stripe card
    if (payMethod === "card" && stripeAvailable) { setShowCardForm(true); return; }

    // Paystack mobile money
    if (payMethod === "mobile") {
      setLoading(true);
      try {
        const { order } = await ordersApi.place({
          vendorId,
          address:       delivery.address,
          deliveryLat:   delivery.lat,
          deliveryLng:   delivery.lng,
          paymentMethod: "mobile",
          items: items.map(i => ({ menuItemId: i.id, qty: i.qty })),
        });
        const { authorizationUrl } = await paymentsApi.paystackInit({
          amount:  grandTotal,
          orderId: order.id,
        });
        clearCart();
        window.location.href = authorizationUrl;
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
      return;
    }

    // Cash
    submitOrder();
  };

  const closeSuccess = () => { clearCart(); navigate("orders"); };

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0 && !placed) return (
    <div className="page cart-page">
      <div className="empty-cart">
        <span className="empty-cart-icon">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Add some delicious food to get started</p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{ width: "auto", padding: "14px 32px" }}>
          Browse Restaurants
        </button>
      </div>
    </div>
  );

  return (
    <div className="cart-v2">
      <div style={{ padding: "0 20px 200px" }}>

        <div className="cart-vendor-label">
          <span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong>
        </div>

        {/* ── Items ── */}
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-emoji">{item.image}</div>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">${(item.price * item.qty).toFixed(2)}</p>
              </div>
              <div className="qty-control">
                <button onClick={() => removeItem(item.id)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => addItem(item, { id: vendorId, name: vendorName })}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Delivery address ── */}
        <p className="cv2-section-title">📍 Delivery Address</p>
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
            style={{ width: "100%", textAlign: "left", background: delivery.address ? "#f7f5f2" : "#fff", border: `1.5px solid ${delivery.address ? "#e8e4df" : "#e53935"}`, borderRadius: 12, padding: "13px 14px", marginBottom: 20, fontFamily: "DM Sans,sans-serif", fontSize: 13, color: delivery.address ? "#0f0f0f" : "#b0a89f", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
            <span style={{ lineHeight: 1.5, flex: 1 }}>{delivery.address || "Tap to set your delivery location on the map…"}</span>
            <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 12, color: "#e53935", fontWeight: 600 }}>{delivery.address ? "Change" : "Set"}</span>
          </button>
        )}

        {/* ── Summary ── */}
        <p className="cv2-section-title">Order summary</p>
        <div className="cv2-summary">
          <div className="cv2-summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="cv2-summary-row"><span>Taxes (5%)</span><span>${taxes.toFixed(2)}</span></div>
          <div className="cv2-summary-row"><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>
          <div className="cv2-summary-divider" />
          <div className="cv2-summary-row cv2-summary-total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>

        {/* ── Payment methods ── */}
        <p className="cv2-section-title">Payment methods</p>
        <div className="cv2-pay-list">
          {PAY_METHODS.map(pm => (
            <button key={pm.id}
              className={`cv2-pay-opt ${payMethod === pm.id ? "active" : ""}`}
              onClick={() => setPayMethod(pm.id)}>
              <div className="cv2-pay-icon">{pm.render ? pm.render() : pm.emoji}</div>
              <div className="cv2-pay-text">
                <span className="cv2-pay-label">{pm.label}{pm.id === "card" && !stripeAvailable ? " (setup required)" : ""}</span>
                <span className="cv2-pay-detail">{pm.detail}</span>
              </div>
              <div className={`cv2-radio ${payMethod === pm.id ? "checked" : ""}`} />
            </button>
          ))}
        </div>

        {/* Stripe form */}
        {payMethod === "card" && stripeAvailable && showCardForm && (
          <div style={{ marginTop: 14, background: "#fafaf9", border: "1.5px solid #f0f0f0", borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#0f0f0f" }}>Enter card details</p>
            <StripeCardForm amount={grandTotal} onSuccess={submitOrder} onCancel={() => setShowCardForm(false)} />
          </div>
        )}

        {payMethod === "card" && !stripeAvailable && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 10, fontSize: 12, color: "#7a7065", lineHeight: 1.6 }}>
            💡 Card payments need <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> configured.
          </div>
        )}

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#991b1b" }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      {!showCardForm && !showPicker && (
        <div className="cv2-bottom-bar">
          <div className="cv2-bottom-total">
            <span className="cv2-bottom-total-label">Total amt</span>
            <span className="cv2-bottom-total-amount">${grandTotal.toFixed(2)}</span>
          </div>
          <button className="cv2-pay-btn" onClick={placeOrder} disabled={loading || !delivery.address}>
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
