import { useCallback, useState } from "react";
import { AccountProvider } from "./context/AccountContext.jsx";
import { useAccount } from "./context/useAccount.js";
import { CartProvider } from "./context/CartContext.jsx";
import { useCart } from "./context/useCart.js";
import CSS from "./styles/index.js";
import AuthScreen from "./components/AuthScreen.jsx";
import { Navbar, BottomNav } from "./components/Navigation.jsx";
import Home from "./pages/Home.jsx";
import VendorPage from "./pages/VendorPage.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import VendorDashboard from "./vendor/VendorDashboard.jsx";

function KivoShell() {
  const { user, initializing, logout } = useAccount();
  const { switchRequest, confirmSwitch, cancelSwitch } = useCart();
  const role = user?.role || "customer";
  const [screen, setScreen] = useState("home");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [toast, setToast] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const navigate = (to, data = null) => {
    if (data) setSelectedVendor(data);
    setScreen(to);
    document.querySelector(".main-content")?.scrollTo(0, 0);
  };

  if (initializing) {
    return (
      <>
        <style>{CSS}</style>
        <div className="kivo-root"><div className="boot-screen">Loading Kivo...</div></div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{CSS}</style>
        <div className="kivo-root"><AuthScreen /></div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="kivo-root">
        <div className="role-switcher">
          <span className="role-label">Signed in</span>
          <div className="account-menu">
            <button className="role-btn active" onClick={() => setAccountOpen(open => !open)}>
              {role === "vendor" ? "🏪 Vendor" : "👤 Customer"}
            </button>
            {accountOpen && (
              <div className="account-popover">
                <p className="account-name">{user.businessName || user.name}</p>
                <p className="account-email">{user.email}</p>
                <button onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </div>

        {role === "customer" ? (
          <>
            <Navbar screen={screen} navigate={navigate} />
            <div className="main-content">
              {screen === "home"    && <Home navigate={navigate} />}
              {screen === "vendor" && <VendorPage vendor={selectedVendor} />}
              {screen === "cart"   && <Cart navigate={navigate} />}
              {screen === "orders" && <Orders />}
              {screen === "profile"&& <Profile />}
            </div>
            <BottomNav screen={screen} navigate={navigate} />
          </>
        ) : (
          <div style={{ paddingTop: 36, minHeight: "100vh" }}>
            <VendorDashboard showToast={showToast} />
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
        {switchRequest && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cancelSwitch()}>
            <div className="confirm-sheet">
              <h2>Start a new cart?</h2>
              <p>
                Your cart has items from {switchRequest.fromVendorName}. Clear it and add from {switchRequest.vendor.name}?
              </p>
              <div className="confirm-actions">
                <button className="btn-secondary" onClick={cancelSwitch}>Keep cart</button>
                <button className="btn-primary" onClick={confirmSwitch}>Clear and add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function KivoApp() {
  return (
    <AccountProvider>
      <CartProvider>
        <KivoShell />
      </CartProvider>
    </AccountProvider>
  );
}
