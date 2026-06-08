# Kivo — Full Stack Food Delivery App

## Architecture

```
kivo-app/          ← Vite + React frontend
  src/
    api/           ← all HTTP + SSE calls to backend
    context/       ← CartContext, AccountContext
    components/    ← AuthScreen, Navbar, BottomNav
    pages/         ← Home, VendorPage, Cart, Orders, Profile
    vendor/        ← VendorDashboard, VOrdersTab, VMenuTab
    data/          ← static category/popular-meals data
    styles/        ← global CSS string

kivo-backend/      ← Node.js + Express + PostgreSQL
  server.js        ← entry point, mounts all routes
  db.js            ← pg pool + schema migration (auto-runs on start)
  seed.js          ← demo data (run once)
  middleware/
    auth.js        ← JWT verify (supports Bearer + ?token= for SSE)
  routes/
    auth.js        ← register, login, /me, /me/update
    vendors.js     ← list, single, vendor profile/menu CRUD
    orders.js      ← place, list, status advance, cancel
    sse.js         ← Server-Sent Events for live order sync
```

---

## Quick Start

### 1. Backend

```bash
cd kivo-backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and optionally PORT + FRONTEND_URL
npm install
npm run seed      # creates schema + demo accounts (safe to re-run)
npm run dev       # starts on http://localhost:4000
```

**`.env` values:**
| Key | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://postgres:pass@localhost:5433/kivo` | Your Postgres connection string |
| `JWT_SECRET` | `some_long_random_string` | Change before deploying |
| `PORT` | `4000` | Optional, defaults to 4000 |
| `FRONTEND_URL` | `http://localhost:5173` | For CORS; use `*` in dev |

### 2. Frontend

```bash
cd kivo-app
# Create .env.local
echo "VITE_API_URL=http://localhost:4000" > .env.local
npm install
npm run dev       # starts on http://localhost:5173
```

---

## Demo Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Customer | customer@kivo.app | demo1234 |
| Vendor (Local Food) | mama@kivo.app | demo1234 |
| Vendor (Burgers) | burgers@kivo.app | demo1234 |
| Vendor (Pizza) | pizza@kivo.app | demo1234 |
| Vendor (Drinks) | drinks@kivo.app | demo1234 |
| Vendor (Grills) | grill@kivo.app | demo1234 |

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register customer or vendor |
| POST | `/api/auth/login` | — | Login → `{ user, token }` |
| GET | `/api/auth/me` | ✅ | Get current user |
| PATCH | `/api/auth/me/update` | ✅ | Update name/phone |

### Vendors
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vendors` | — | List all open vendors (`?category=Burgers`) |
| GET | `/api/vendors/:id` | — | Single vendor + menu |
| GET | `/api/vendors/me/profile` | vendor | Own profile |
| PATCH | `/api/vendors/me/profile` | vendor | Update profile |
| GET | `/api/vendors/me/menu` | vendor | Own full menu (incl. hidden) |
| POST | `/api/vendors/me/menu` | vendor | Add item |
| PATCH | `/api/vendors/me/menu/:id` | vendor | Update item |
| DELETE | `/api/vendors/me/menu/:id` | vendor | Delete item |

### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | customer | Place order |
| GET | `/api/orders` | customer | My orders |
| GET | `/api/orders/:id` | ✅ | Single order |
| GET | `/api/orders/vendor/active` | vendor | Active orders queue |
| GET | `/api/orders/vendor/history` | vendor | Delivered orders |
| PATCH | `/api/orders/:id/status` | vendor | Advance status |
| DELETE | `/api/orders/:id` | vendor | Cancel/reject |

### Real-Time (SSE)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/sse/order/:orderId` | customer | Live updates for one order |
| GET | `/api/sse/vendor` | vendor | New orders + status changes |

Token passed as `?token=<jwt>` since `EventSource` doesn't support headers.

---

## Order Status Flow

```
Pending → Accepted → Cooking → Ready → Delivered
                  ↘ Cancelled (vendor reject)
```

- **Customer** sees live tracking via SSE on the Orders page
- **Vendor** receives new order ping via SSE instantly, no polling

---

## What's Working End-to-End

- ✅ Register / login (customer + vendor)
- ✅ JWT auth with 30-day sessions
- ✅ Vendor list loads from DB (no hardcoded data)
- ✅ Menu loads fresh from DB on vendor page
- ✅ Cart → real order placement with server-side price validation
- ✅ Orders page with live SSE status tracking
- ✅ Vendor dashboard: accept/reject/advance orders live via SSE
- ✅ Vendor menu management: add/edit/toggle/delete items
- ✅ Profile editing
- ✅ Schema auto-migrates on server start
- ✅ Seed script with all 5 demo vendors + customer

## Next Steps (not yet built)

- [ ] Push notifications (Firebase FCM) for mobile
- [ ] Mobile Money / card payment (M-Pesa, Stripe)
- [ ] Customer reviews & ratings
- [ ] Order history stats on vendor dashboard
- [ ] Distance calculation (Google Maps API)
- [ ] Image uploads for menu items (Cloudinary/S3)
