import { useState } from "react";
import { AccountProvider, useAccount } from "./context/AccountContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import CSS from "./styles/index.js";
import AuthScreen from "./components/AuthScreen.jsx";
import { Navbar, BottomNav } from "./components/Navigation.jsx";
import Home from "./pages/Home.jsx";
import VendorPage from "./pages/VendorPage.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import Following from "./pages/Following.jsx";
import VendorDashboard from "./vendor/VendorDashboard.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";

function KivoShell() {
  const { user, initializing } = useAccount();
  const role = user?.role || "customer";
  const [screen, setScreen] = useState("home");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const navigate = (to, data = null) => {
    if (data) setSelectedVendor(data);
    setScreen(to);
    document.querySelector(".main-content")?.scrollTo(0, 0);
  };

  if (initializing) {
    return (
      <>
        <style>{CSS}</style>
        <div className="kivo-root" style={{ 
          backgroundColor: "#dc2626", 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%"
        }}>
          <div style={{ width: "100%", maxWidth: "240px", display: "flex", justifyContent: "center" }}>
            <img 
              src="/icons/red-screen.png" 
              alt="Loading Kivo..." 
              style={{ width: "100%", height: "auto", objectFit: "contain" }} 
            />
          </div>
        </div>
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

        {role === "customer" ? (
          <>
            <Navbar screen={screen} navigate={navigate} />
            <div className="main-content">
              {screen === "home"    && <Home navigate={navigate} />}
              {screen === "vendor" && <VendorPage vendor={selectedVendor} />}
              {screen === "cart"   && <Cart navigate={navigate} />}
              {screen === "orders" && <Orders />}
              {screen === "profile"&& <Profile navigate={navigate} />}
              {screen === "following" && <Following navigate={navigate} />}
            </div>
            <BottomNav screen={screen} navigate={navigate} />
          </>
        ) : role === "admin" ? (
          <div style={{ minHeight: "100vh" }}>
            <AdminDashboard showToast={showToast} />
          </div>
        ) : (
          <div style={{ minHeight: "100vh" }}>
            <VendorDashboard showToast={showToast} />
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

export default function KivoApp() {
  return (
    <ThemeProvider>
      <AccountProvider>
        <CartProvider>
          <KivoShell />
        </CartProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}
