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
import VendorDashboard from "./vendor/VendorDashboard.jsx";

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

        {role === "customer" ? (
          <>
            <Navbar screen={screen} navigate={navigate} />
            <div className="main-content">
              {screen === "home"    && <Home navigate={navigate} />}
              {screen === "vendor" && <VendorPage vendor={selectedVendor} />}
              {screen === "cart"   && <Cart navigate={navigate} />}
              {screen === "orders" && <Orders />}
              {screen === "profile"&& <Profile navigate={navigate} />}
            </div>
            <BottomNav screen={screen} navigate={navigate} />
          </>
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
