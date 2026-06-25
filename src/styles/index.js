const CSS = `
  /*
   * Brand heading font: Fraunces (Google Fonts, free for commercial use)
   * ──────────────────────────────────────────────────────────────────────
   */
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800;9..144,900&family=Syne:wght@400;600;700;800&family=Roboto:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* Heading/brand font (logo, h1-h4, buttons). */
    --font-heading: 'Fraunces', 'Syne', serif;
    /* Body/UI font. The first three are proprietary system fonts that only
       render if actually installed on the device (Apple's SF, Adobe's
       Proxima Nova, Helvetica Now) — Roboto/Poppins/Open Sans are loaded
       above as real webfonts so there's always a consistent fallback. */
    --font-body: 'Helvetica Now', -apple-system, 'San Francisco', 'Proxima Nova', Roboto, Poppins, 'Open Sans', sans-serif;

    --orange: #e53935;
    --orange-soft: #fdecea;
    --black: #0f0f0f;
    --dark: #1a1a1a;
    --card: #ffffff;
    --bg: #f7f5f2;
    --border: #e8e4df;
    --text: #1a1a1a;
    --muted: #7a7065;
    --green: #10b981;
    --green-soft: #d1fae5;
    --red: #ef4444;
    --red-soft: #fee2e2;
    --yellow: #f59e0b;
    --yellow-soft: #fef3c7;
    --radius: 12px;
    --nav-h: 60px;
    --bot-h: 68px;
    /* Safe area insets for PWA standalone mode (notch/status bar/home indicator) */
    --sat: env(safe-area-inset-top, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --shadow-sm: 0 1px 2px rgba(15,15,15,0.04), 0 8px 20px rgba(15,15,15,0.05);
    --shadow-md: 0 12px 30px rgba(15,15,15,0.11);

    /* v2 surface tokens (Home/Cart/Orders/Profile/Auth/Vendor dashboard) */
    --surface: #ffffff;
    --surface-alt: #f7f7f7;
    --surface-soft: #f5f5f5;
    --surface-2: #fafafa;
    --on-surface: #0f0f0f;
    --on-surface-muted: #999999;
    --on-surface-faint: #bbbbbb;
    --line: #f0f0f0;
    --line-soft: #f5f5f5;
    --chip-bg: #fdecea;
    --chip-line: #ffe8da;
    --skeleton-base: #f0f0f0;
    --skeleton-shine: #e8e8e8;
    --dark-btn: #2b2b2b;
  }

  html { background: #ece7df; }
  body {
    font-family: var(--font-body);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0) 240px),
      var(--bg);
    color: var(--text);
    min-height: 100svh;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  button, input { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  button:focus-visible, input:focus-visible {
    outline: 3px solid rgba(229,57,53,0.28);
    outline-offset: 2px;
  }

  .kivo-root {
    width: 100%; max-width: 420px; margin: 0 auto;
    background: var(--bg); min-height: 100svh;
    position: relative; overflow: hidden;
    box-shadow: 0 0 60px rgba(0,0,0,0.14);
  }

  /* ── AUTH V2 — matches the white/red design language ── */
  .auth-v2 {
    background: var(--surface); min-height: 100svh;
    padding: 0 20px 40px;
    display: flex; flex-direction: column;
  }
  .av2-header { padding: 48px 0 28px; text-align: center; }
  .av2-logo {
    font-family: var(--font-heading); font-weight: 800; font-size: 36px;
    color: var(--on-surface); letter-spacing: -0.5px; margin-bottom: 8px;
  }
  .av2-tagline { font-size: 13px; color: var(--on-surface-muted); line-height: 1.5; max-width: 260px; margin: 0 auto; }

  .av2-card {
    background: var(--surface); border: 1.5px solid var(--line); border-radius: 22px;
    padding: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  }
  .av2-tabs {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
    background: var(--surface-alt); padding: 4px; border-radius: 14px; margin-bottom: 18px;
  }
  .av2-tab {
    border: none; border-radius: 11px; padding: 11px;
    background: transparent; color: var(--on-surface-muted); font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: var(--font-body); transition: all 0.18s;
  }
  .av2-tab.active { background: var(--surface); color: var(--on-surface); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

  .av2-role-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .av2-role-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px;
    padding: 14px 10px; color: var(--on-surface-muted); font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: var(--font-body); transition: all 0.18s;
  }
  .av2-role-icon { font-size: 22px; }
  .av2-role-btn.active { border-color: var(--orange); color: var(--orange); background: var(--chip-bg); }

  .av2-form { display: flex; flex-direction: column; gap: 14px; }
  .av2-field { display: flex; flex-direction: column; gap: 5px; }
  .av2-label { font-size: 11px; font-weight: 600; color: var(--on-surface-faint); letter-spacing: 0.2px; }
  .av2-input {
    width: 100%; box-sizing: border-box;
    border: 1.5px solid var(--line); border-radius: 12px;
    padding: 13px 14px; background: var(--surface-alt); color: var(--on-surface);
    font-size: 14px; font-family: var(--font-body); outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .av2-input:focus { border-color: var(--orange); background: var(--surface); }
  .av2-input::placeholder { color: var(--on-surface-faint); }

  .av2-error {
    background: var(--chip-bg); color: #c62828; border: 1px solid #ffcdd2;
    border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.4;
  }

  .av2-submit {
    border: none; border-radius: 14px; padding: 15px;
    background: var(--orange); color: white;
    font-family: var(--font-body); font-size: 15px; font-weight: 700;
    cursor: pointer; box-shadow: 0 8px 20px rgba(229,57,53,0.3);
    transition: transform 0.15s, opacity 0.15s;
  }
  .av2-submit:active { transform: scale(0.98); }
  .av2-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .av2-hint { color: var(--on-surface-muted); font-size: 13px; line-height: 1.5; margin-top: 16px; text-align: center; }
  .av2-hint-link {
    background: none; border: none; color: var(--orange); font-weight: 700;
    font-size: 13px; cursor: pointer; padding: 0; font-family: var(--font-body);
  }

  .boot-screen { min-height: 100svh; display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-weight: 800; }

  /* ── ACCOUNT POPOVER ── */
  .account-menu { position: relative; }
  .account-popover {
    position: absolute; top: 31px; left: 0; width: 260px; background: var(--card); color: var(--text);
    border: 1px solid var(--border); border-radius: 14px; padding: 12px;
    box-shadow: 0 18px 45px rgba(0,0,0,0.22); z-index: 250;
  }
  .account-name { font-family: var(--font-heading); font-size: 14px; font-weight: 800; margin-bottom: 3px; }
  .account-email { color: var(--muted); font-size: 12px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .account-popover button {
    width: 100%; border: 1px solid #fecaca; background: #fff5f5; color: var(--red);
    border-radius: 10px; padding: 9px 12px; font-size: 13px; font-weight: 700; cursor: pointer;
  }

  /* ── CUSTOMER LAYOUT ── */
  .navbar {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px;
    height: calc(var(--nav-h) + var(--sat));
    padding-top: var(--sat);
    background: rgba(247,245,242,0.9); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border); z-index: 100;
    display: flex; align-items: center;
  }
  .nav-inner { width: 100%; display: flex; align-items: center; padding: 0 16px; }
  .nav-home { justify-content: space-between; }
  .nav-page { justify-content: space-between; }
  .nav-logo { font-family: var(--font-heading); font-weight: 800; font-size: 24px; line-height: 1; }
  .logo-k { color: var(--orange); }
  .logo-ivo { color: var(--black); }
  .nav-actions { display: flex; gap: 8px; }
  .nav-icon-btn {
    width: 38px; height: 38px; border-radius: 50%; border: none;
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; position: relative; box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }
  .nav-icon-btn:active, .nav-back:active, .bottom-tab:active, .cat-pill:active, .popular-card:active, .vendor-card:active, .menu-item:active, .profile-item:active, .payment-opt:active { transform: scale(0.98); }
  .notif-dot {
    position: absolute; top: 8px; right: 8px;
    width: 8px; height: 8px; border-radius: 50%; background: var(--orange);
    border: 2px solid var(--bg);
  }
  .cart-badge {
    position: absolute; top: -4px; right: -4px;
    background: var(--orange); color: white; font-size: 10px; font-weight: 700;
    width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .nav-back {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .nav-title { font-family: var(--font-heading); font-weight: 700; font-size: 17px; }

  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px;
    height: calc(var(--bot-h) + var(--sab));
    padding-bottom: var(--sab);
    background: rgba(247,245,242,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid var(--border); z-index: 100;
    display: flex; align-items: flex-start; padding-top: 0;
  }
  .bottom-tab {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    min-height: 58px; padding: 8px 0; color: var(--muted); font-size: 11px; font-family: var(--font-body);
    transition: color 0.2s, transform 0.18s ease; font-weight: 500;
  }
  .bottom-tab.active { color: var(--orange); }
  .bottom-tab svg { transition: transform 0.2s; }
  .bottom-tab.active svg { transform: translateY(-2px); }

  .main-content {
    padding-top: calc(var(--nav-h) + var(--sat));
    padding-bottom: calc(var(--bot-h) + var(--sab));
    min-height: 100svh; height: 100svh; overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .page { padding: 0; }

  /* ── HOME ── */
  .home-page {
    margin-top: calc(-1 * (var(--nav-h) + var(--sat)));
  }
  .home-hero {
    background:
      linear-gradient(145deg, rgba(229,57,53,0.18), rgba(255,255,255,0) 42%),
      linear-gradient(135deg, #141414 0%, #2a190d 100%);
    padding: 26px 16px 28px;
    padding-top: calc(var(--nav-h) + var(--sat) + 26px);
    position: relative; overflow: hidden;
  }
  .home-hero::before {
    content: '🍽️'; position: absolute; top: 18px; right: 18px;
    font-size: 74px; line-height: 1; opacity: 0.12; transform: rotate(-10deg);
  }
  .greeting-sub { color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 4px; }
  .greeting-main { font-family: var(--font-heading); font-weight: 800; font-size: 28px; color: white; line-height: 1.2; margin-bottom: 20px; }
  .greeting-main em { color: var(--orange); font-style: normal; }
  .search-bar {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 14px; display: flex; align-items: center;
    padding: 12px 14px; gap: 10px; backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .search-bar svg { color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .search-bar input { flex: 1; background: none; border: none; outline: none; color: white; font-size: 14px; font-family: var(--font-body); }
  .search-bar input::placeholder { color: rgba(255,255,255,0.4); }
  .clear-search { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px; padding: 2px; }
  .promo-banner {
    margin: 16px; border-radius: var(--radius);
    background: linear-gradient(135deg, #e53935, #ff5252);
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 12px 30px rgba(229,57,53,0.28);
  }
  .promo-text .promo-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; background: rgba(255,255,255,0.25); border-radius: 20px; padding: 2px 8px; color: white; display: inline-block; margin-bottom: 6px; }
  .promo-text h3 { color: white; font-family: var(--font-heading); font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .promo-text p { color: rgba(255,255,255,0.85); font-size: 12px; }
  .promo-art { font-size: 40px; }
  .section { padding: 0 0 8px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 10px; }
  .section-header h2 { font-family: var(--font-heading); font-size: 17px; font-weight: 700; }
  .section-count { font-size: 12px; color: var(--muted); }
  .categories-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .categories-scroll::-webkit-scrollbar { display: none; }
  .cat-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--card); white-space: nowrap; cursor: pointer; font-size: 13px; font-weight: 500; font-family: var(--font-body); transition: all 0.2s; flex-shrink: 0; }
  .cat-pill.active { background: var(--black); border-color: var(--black); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .popular-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .popular-scroll::-webkit-scrollbar { display: none; }
  .popular-card { background: var(--card); border-radius: var(--radius); padding: 14px; width: 160px; flex-shrink: 0; cursor: pointer; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--border); }
  .popular-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .popular-emoji { font-size: 40px; margin-bottom: 10px; display: block; }
  .popular-name { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
  .popular-vendor { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .popular-bottom { display: flex; justify-content: space-between; align-items: center; }
  .popular-price { font-weight: 700; color: var(--orange); font-size: 14px; }
  .popular-rating { font-size: 12px; }
  .vendors-list { display: flex; flex-direction: column; gap: 12px; padding: 0 16px; }
  .vendor-card { background: var(--card); border-radius: var(--radius); overflow: hidden; cursor: pointer; border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; display: flex; min-height: 126px; }
  .vendor-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .vendor-img { width: 100px; flex-shrink: 0; background: linear-gradient(135deg, #f0ede8, #e8e4df); display: flex; align-items: center; justify-content: center; position: relative; font-size: 44px; }
  .vendor-tag { position: absolute; top: 8px; left: 8px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: white; padding: 3px 7px; border-radius: 6px; }
  .vendor-info { padding: 14px; flex: 1; min-width: 0; }
  .vendor-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .vendor-header h3 { font-family: var(--font-heading); font-size: 14px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
  .vendor-rating { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .vendor-category { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .vendor-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .vendor-meta span { font-size: 11px; color: var(--muted); }
  .empty-state { text-align: center; padding: 40px 16px; }
  .empty-state p { font-size: 18px; margin-bottom: 8px; font-weight: 600; }
  .empty-state span { color: var(--muted); font-size: 14px; }

  /* ── VENDOR PAGE ── */
  .vendor-hero { background: linear-gradient(145deg, rgba(229,57,53,0.16), rgba(255,255,255,0) 42%), linear-gradient(135deg, #141414, #2a190d); padding: 24px 16px; position: relative; min-height: 200px; display: flex; flex-direction: column; justify-content: flex-end; }
  .vendor-hero-art { font-size: 80px; position: absolute; top: 20px; right: 20px; opacity: 0.35; }
  .vendor-hero-overlay { position: relative; z-index: 1; }
  .vendor-hero-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: white; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 8px; }
  .vendor-hero-overlay h2 { font-family: var(--font-heading); font-size: 22px; font-weight: 800; color: white; margin-bottom: 6px; }
  .vendor-hero-overlay p { color: rgba(255,255,255,0.65); font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
  .vendor-hero-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vendor-hero-meta span { font-size: 12px; color: rgba(255,255,255,0.8); }
  .vendor-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; }
  .vtab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.2s; }
  .vtab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .menu-content { padding: 8px 0; }
  .menu-section { padding: 8px 0; }
  .menu-section-title { font-family: var(--font-heading); font-size: 15px; font-weight: 700; padding: 12px 16px 8px; }
  .menu-item { display: flex; gap: 12px; padding: 14px 16px; background: var(--card); margin: 0 16px 10px; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .menu-item-emoji { font-size: 44px; flex-shrink: 0; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 12px; overflow: hidden; }
  .menu-item-photo { width: 100%; height: 100%; object-fit: cover; }
  .menu-item-info { flex: 1; min-width: 0; }
  .menu-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
  .menu-item-top h4 { font-family: var(--font-heading); font-size: 14px; font-weight: 700; min-width: 0; }
  .popular-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; background: var(--orange-soft); color: var(--orange); padding: 2px 7px; border-radius: 6px; }
  .menu-item-info p { font-size: 12px; color: var(--muted); line-height: 1.4; margin-bottom: 10px; }
  .menu-item-bottom { display: flex; justify-content: space-between; align-items: center; }
  .menu-item-price { font-weight: 700; color: var(--orange); font-size: 15px; }
  .add-btn { background: var(--orange); color: white; border: none; border-radius: 10px; min-width: 70px; min-height: 34px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.2s, transform 0.18s ease; }
  .add-btn:hover { background: #c62828; }
  .qty-control { display: flex; align-items: center; gap: 10px; background: var(--black); border-radius: 10px; padding: 6px 10px; }
  .qty-control button { background: none; border: none; color: white; font-size: 16px; cursor: pointer; width: 20px; display: flex; align-items: center; justify-content: center; }
  .qty-control span { color: white; font-weight: 700; font-size: 14px; min-width: 16px; text-align: center; }
  .reviews-content { padding: 16px; }
  .reviews-summary { display: flex; align-items: center; gap: 16px; background: var(--card); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; border: 1px solid var(--border); }
  .reviews-score { font-family: var(--font-heading); font-size: 48px; font-weight: 800; color: var(--orange); line-height: 1; }
  .reviews-stars { font-size: 18px; margin-bottom: 4px; }
  .review-card { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); }
  .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .review-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--orange); color: white; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .review-name { font-weight: 600; font-size: 14px; }
  .review-time { font-size: 11px; color: var(--muted); }
  .review-rating { margin-left: auto; font-size: 14px; }
  .review-text { font-size: 13px; color: var(--muted); line-height: 1.5; }

  /* ── CART ── */
  .cart-page { padding: 16px; }
  .cart-vendor-label { background: var(--orange-soft); border: 1px solid rgba(229,57,53,0.2); border-radius: 12px; padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .cart-items { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
  .cart-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .cart-item-emoji { font-size: 32px; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .cart-item-price { font-size: 13px; color: var(--orange); font-weight: 600; }
  .cart-section { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .cart-section h3 { font-family: var(--font-heading); font-size: 15px; font-weight: 700; margin-bottom: 12px; }
  .address-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: var(--font-body); outline: none; transition: border-color 0.2s; background: var(--bg); }
  .address-input:focus { border-color: var(--orange); }
  .cart-error { margin-top: 10px; background: var(--red-soft); border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; padding: 9px 11px; font-size: 12px; line-height: 1.4; }
  .payment-options { display: flex; flex-direction: column; gap: 8px; }
  .payment-opt { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 12px; cursor: pointer; font-size: 14px; font-family: var(--font-body); font-weight: 500; transition: all 0.2s; background: none; }
  .payment-opt.active { border-color: var(--orange); background: var(--orange-soft); }
  .payment-opt.disabled { opacity: 0.5; cursor: not-allowed; }
  .coming-soon { margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; background: var(--border); border-radius: 6px; padding: 2px 8px; }
  .stripe-card-wrap:focus-within { border-color: var(--orange) !important; }
  .cart-summary { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .summary-row span:first-child { color: var(--muted); }
  .total-row { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 700; }
  .btn-primary { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg, #e53935, #c62828); color: white; font-size: 16px; font-weight: 700; font-family: var(--font-heading); cursor: pointer; box-shadow: 0 8px 24px rgba(229,57,53,0.4); transition: all 0.2s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(229,57,53,0.5); }
  .btn-primary:disabled { opacity: 0.7; cursor: wait; transform: none; }
  .btn-secondary { width: 100%; padding: 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--card); color: var(--text); font-size: 14px; font-weight: 700; font-family: var(--font-body); cursor: pointer; }
  .place-order-btn { margin-bottom: 16px; }
  .empty-cart { text-align: center; padding: 60px 16px; }
  .empty-cart-icon { font-size: 60px; margin-bottom: 16px; display: block; }
  .empty-cart h3 { font-family: var(--font-heading); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-cart p { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
  .order-success { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
  .success-animation { text-align: center; padding: 24px; }
  .success-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(16,185,129,0.4); animation: scaleIn 0.4s ease; }
  @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
  .success-animation h2 { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin-bottom: 10px; }
  .success-animation p { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
  .success-loader { background: var(--border); border-radius: 4px; height: 4px; overflow: hidden; }
  .success-bar { height: 100%; background: var(--orange); border-radius: 4px; animation: load 2.5s linear; }
  @keyframes load { from { width: 0%; } to { width: 100%; } }

  /* ── CUSTOMER ORDERS ── */
  .orders-page { padding: 0; }
  .orders-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; position: sticky; top: calc(var(--nav-h) + var(--sat)); z-index: 10; }
  .otab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
  .otab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .otab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .orders-list { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .order-card { background: var(--card); border-radius: var(--radius); padding: 16px; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: var(--shadow-sm); }
  .order-card.order-live { border-color: rgba(229,57,53,0.3); }
  .live-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--orange); margin-bottom: 10px; display: flex; align-items: center; gap: 4px; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .order-vendor { font-family: var(--font-heading); font-weight: 700; font-size: 15px; margin-bottom: 3px; }
  .order-id { font-size: 11px; color: var(--muted); }
  .order-status-badge { font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 20px; white-space: nowrap; }
  .status-track { display: flex; align-items: flex-start; background: var(--bg); border-radius: 12px; padding: 14px; margin-bottom: 14px; overflow-x: auto; gap: 0; scrollbar-width: none; }
  .status-track::-webkit-scrollbar { display: none; }
  .track-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; position: relative; min-width: 56px; }
  .track-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--border); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: all 0.4s; color: var(--muted); z-index: 1; position: relative; }
  .track-step.done .track-dot { background: var(--green); border-color: var(--green); color: white; }
  .track-step.current .track-dot { background: var(--orange); border-color: var(--orange); color: white; box-shadow: 0 0 0 4px rgba(229,57,53,0.2); }
  .track-step span { font-size: 10px; color: var(--muted); text-align: center; font-weight: 500; }
  .track-step.done span, .track-step.current span { color: var(--text); font-weight: 600; }
  .track-line { position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: var(--border); z-index: 0; }
  .track-line.done { background: var(--green); }
  .order-items { border-top: 1px solid var(--border); padding-top: 12px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
  .order-item-row span:first-child { color: var(--muted); }
  .order-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; padding-top: 10px; border-top: 1px solid var(--border); margin-top: 8px; }

  /* ── PROFILE ── */
  .profile-page { padding: 0 0 16px; }
  .profile-hero { background: linear-gradient(135deg, #1a1a1a, #2d1a0a); padding: 24px 16px; display: flex; align-items: center; gap: 16px; }
  .profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), #ff5252); color: white; font-family: var(--font-heading); font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(229,57,53,0.4); }
  .profile-info h2 { font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
  .profile-info p { color: rgba(255,255,255,0.6); font-size: 13px; }
  .profile-stats { background: var(--card); margin: 16px; border-radius: var(--radius); display: flex; align-items: center; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .profile-stat { flex: 1; padding: 16px; text-align: center; }
  .stat-num { font-family: var(--font-heading); font-size: 20px; font-weight: 800; display: block; margin-bottom: 2px; }
  .stat-label { font-size: 11px; color: var(--muted); }
  .stat-divider { width: 1px; height: 40px; background: var(--border); }
  .profile-section { margin: 0 16px 12px; }
  .profile-section-title { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); padding: 0 0 8px; }
  .profile-list { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
  .profile-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: none; background: none; cursor: pointer; border-bottom: 1px solid var(--border); font-family: var(--font-body); font-size: 14px; text-align: left; transition: background 0.15s; }
  .profile-item:last-child { border-bottom: none; }
  .profile-item:hover { background: var(--bg); }
  .profile-item-icon { font-size: 20px; }
  .profile-item-label { flex: 1; font-weight: 500; }
  .profile-item-arrow { color: var(--muted); font-size: 20px; }
  .logout-btn { margin: 16px; width: calc(100% - 32px); padding: 14px; border-radius: var(--radius); border: 1.5px solid #ef4444; background: none; color: #ef4444; font-size: 14px; font-weight: 600; font-family: var(--font-body); cursor: pointer; transition: all 0.2s; }
  .logout-btn:hover { background: #fef2f2; }

  /* ── VENDOR DASHBOARD ── */
  .vd-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 100px; background: var(--surface); min-height: 100svh; }
  .vd-header {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    padding: 18px 16px 14px;
    padding-top: calc(var(--sat) + 18px);
    position: sticky; top: 0; z-index: 50;
  }
  .vd-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .vd-logo { font-family: var(--font-heading); font-weight: 800; font-size: 22px; color: var(--on-surface); letter-spacing: -0.5px; }
  .vd-logo span { color: var(--orange); font-weight: 600; font-size: 13px; letter-spacing: 0; font-family: var(--font-body); }
  .vendor-badge { background: var(--chip-bg); border: 1px solid #ffd9d6; border-radius: 100px; padding: 6px 14px; font-size: 12px; color: #c62828; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: var(--font-body); }
  .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .vd-tabs { display: flex; gap: 8px; }
  .vd-tab {
    flex: 1; padding: 9px 6px; border-radius: 100px;
    border: 1.5px solid var(--line); background: var(--surface);
    cursor: pointer; font-family: var(--font-body);
    font-size: 13px; font-weight: 600; color: var(--on-surface-muted);
    transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .vd-tab.active { color: white; background: var(--orange); border-color: var(--orange); box-shadow: 0 4px 12px rgba(229,57,53,0.28); }
  .tab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { background: var(--card); border-radius: 10px; border: 1px solid var(--border); padding: 14px; }
  .stat-card .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-card .stat-value { font-family: var(--font-heading); font-size: 22px; font-weight: 800; }
  .stat-card .stat-value.orange { color: var(--orange); }
  .stat-card .stat-value.green { color: var(--green); }
  .stat-card .stat-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .vd-section-title { font-family: var(--font-heading); font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .vorder-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm); }
  .vorder-card-header { padding: 14px 16px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
  .vorder-card-id { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .vorder-card-customer { font-family: var(--font-heading); font-size: 15px; font-weight: 700; }
  .vorder-card-time { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .vorder-status-pill { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .vpill-pending { background: var(--yellow-soft); color: #92400e; }
  .vpill-cooking { background: var(--orange-soft); color: #9a3412; }
  .vpill-ready { background: var(--green-soft); color: #065f46; }
  .vpill-done { background: #e0f2fe; color: #0369a1; }
  .vpill-cancel { background: #fee2e2; color: #991b1b; }
  .vorder-items-list { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .vorder-item-row { display: flex; justify-content: space-between; font-size: 13px; }
  .vorder-item-row .qty { color: var(--orange); font-weight: 600; margin-right: 4px; }
  .vorder-item-row .price { color: var(--muted); }
  .vorder-card-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .vorder-total-label { font-size: 12px; color: var(--muted); }
  .vorder-total-amount { font-family: var(--font-heading); font-weight: 800; font-size: 16px; }
  .action-btns { display: flex; gap: 8px; }
  .btn-accept { background: var(--green); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: opacity 0.2s; }
  .btn-accept:hover { opacity: 0.85; }
  .btn-reject { background: var(--red-soft); color: var(--red); border: 1px solid #fca5a5; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: opacity 0.2s; }
  .btn-reject:hover { opacity: 0.75; }
  .btn-advance { background: var(--orange); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: opacity 0.2s; flex: 1; }
  .btn-advance:hover { opacity: 0.85; }
  .empty-orders { text-align: center; padding: 48px 0; }
  .empty-orders .emoji { font-size: 48px; margin-bottom: 12px; }
  .empty-orders p { font-family: var(--font-heading); font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .empty-orders span { font-size: 13px; color: var(--muted); }

  /* VENDOR MENU MANAGEMENT */
  .vm-item-row { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
  .mi-photo { width: 52px; height: 52px; border-radius: 12px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg); }
  .mi-emoji { font-size: 36px; flex-shrink: 0; }
  .mi-photo-img { width: 100%; height: 100%; object-fit: cover; }
  .mi-info { flex: 1; min-width: 0; }
  .mi-name { font-family: var(--font-heading); font-size: 14px; font-weight: 700; }
  .mi-desc { font-size: 12px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mi-price { font-size: 14px; font-weight: 700; color: var(--orange); margin-top: 4px; }
  .mi-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .toggle { width: 40px; height: 22px; border-radius: 11px; background: #d1d0cc; border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .toggle.on { background: var(--green); }
  .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle.on::after { transform: translateX(18px); }
  .btn-edit { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--muted); font-family: var(--font-body); transition: all 0.15s; }
  .btn-edit:hover { border-color: var(--orange); color: var(--orange); }
  .btn-add-item { width: 100%; background: var(--orange-soft); color: var(--orange); border: 1.5px dashed var(--orange); border-radius: var(--radius); padding: 14px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
  .btn-add-item:hover { background: #ffe4d6; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; width: 100%; left: 0; transform: none; }
  .modal-sheet { background: var(--card); border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 480px; animation: slideUp 0.25s ease; }
  .confirm-sheet { background: var(--card); border-radius: 20px 20px 0 0; padding: 22px 18px 28px; width: 100%; animation: slideUp 0.25s ease; }
  .confirm-sheet h2 { font-family: var(--font-heading); font-size: 19px; font-weight: 800; margin-bottom: 8px; }
  .confirm-sheet p { color: var(--muted); font-size: 14px; line-height: 1.45; margin-bottom: 16px; }
  .confirm-actions { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-title { font-family: var(--font-heading); font-size: 17px; font-weight: 700; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .modal-close { background: var(--bg); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: 0.4px; }
  .form-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px; font-family: var(--font-body); background: var(--bg); color: var(--text); outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--orange); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-save { width: 100%; background: var(--orange); color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--font-body); margin-top: 8px; transition: opacity 0.2s; }
  .btn-save:hover { opacity: 0.9; }

  /* TOAST */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--black); color: white; padding: 10px 18px; border-radius: 100px; font-size: 13px; font-weight: 500; z-index: 999; white-space: nowrap; animation: toastIn 0.25s ease; max-width: 360px; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

  /* ═══════════════════════════════════════════════════════
     HOME V2  — matches the new design reference
  ═══════════════════════════════════════════════════════ */

  .home-v2, .profile-v2, .orders-v2 {
    background: var(--surface); min-height: 100svh;
    margin-top: calc(-1 * var(--nav-h));
  }
  .home-v2 { padding-bottom: 90px; }
  .profile-v2 { padding-bottom: 100px; }

  /* Header */
  .hv2-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 18px 20px 10px;
  }
  .hv2-logo {
    font-family: var(--font-heading); font-size: 28px; font-weight: 800;
    color: var(--on-surface); letter-spacing: -0.5px;
  }
  .hv2-tagline {
    font-size: 13px; color: var(--orange); font-weight: 500; margin-top: 1px;
    text-decoration: underline; text-underline-offset: 2px;
  }
  .hv2-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: var(--surface-alt); display: flex; align-items: center;
    justify-content: center; color: var(--muted); cursor: pointer;
    overflow: hidden; border: 2px solid var(--line);
  }

  /* Search row */
  .hv2-search-row {
    display: flex; align-items: center; gap: 10px;
    padding: 4px 20px 14px;
  }
  .hv2-search {
    flex: 1; display: flex; align-items: center; gap: 10px;
    background: var(--surface-soft); border-radius: 14px; padding: 12px 14px;
  }
  .hv2-search input {
    flex: 1; background: none; border: none; outline: none;
    font-size: 14px; color: var(--on-surface); font-family: var(--font-body);
  }
  .hv2-search input::placeholder { color: var(--on-surface-faint); }
  .hv2-filter-btn {
    width: 46px; height: 46px; border-radius: 14px;
    background: var(--orange); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 12px rgba(229,57,53,0.35);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .hv2-filter-btn:active { transform: scale(0.94); box-shadow: 0 2px 6px rgba(229,57,53,0.25); }

  /* Location nudge */
  .hv2-nudge {
    margin: 0 20px 12px; padding: 12px 14px;
    background: var(--chip-bg); border: 1.5px solid var(--chip-line);
    border-radius: 14px; display: flex; align-items: center; gap: 10px;
    font-size: 13px;
  }
  .hv2-nudge-btn {
    background: var(--orange); border: none; border-radius: 8px;
    padding: 6px 12px; color: white; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: var(--font-body); flex-shrink: 0;
  }

  /* Category pills */
  .hv2-cats {
    display: flex; gap: 8px; padding: 0 20px 16px;
    overflow-x: auto; scrollbar-width: none;
  }
  .hv2-cats::-webkit-scrollbar { display: none; }
  .hv2-cat {
    display: flex; align-items: center; gap: 5px;
    padding: 8px 18px; border-radius: 100px;
    border: 1.5px solid var(--line); background: var(--surface);
    color: var(--on-surface-muted); font-size: 13px; font-weight: 500;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    font-family: var(--font-body);
    transition: all 0.18s;
  }
  .hv2-cat.active {
    background: var(--orange); border-color: var(--orange);
    color: white; box-shadow: 0 4px 12px rgba(229,57,53,0.28);
  }

  /* 2-column card grid */
  .hv2-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }

  /* Restaurant card */
  .hv2-card {
    background: var(--surface); border-radius: 16px;
    border: 1px solid var(--line);
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    cursor: pointer; overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .hv2-card:active { transform: scale(0.97); box-shadow: 0 1px 6px rgba(0,0,0,0.1); }
  .hv2-card-img {
    position: relative; height: 130px;
    background: linear-gradient(135deg, var(--chip-bg) 0%, var(--surface-alt) 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .hv2-card-emoji { font-size: 58px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
  .hv2-card-photo { width: 100%; height: 100%; object-fit: cover; }
  .hv2-card-badge {
    position: absolute; top: 8px; left: 8px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.3px;
    color: white; border-radius: 6px; padding: 3px 7px;
    text-transform: uppercase;
  }
  .hv2-card-body { padding: 10px 12px 13px; }
  .hv2-card-name {
    font-weight: 700; font-size: 13px; color: var(--on-surface);
    margin-bottom: 2px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .hv2-card-cat { font-size: 12px; color: var(--on-surface-muted); margin-bottom: 6px; }
  .hv2-card-meta { display: flex; align-items: center; gap: 8px; }
  .hv2-card-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 12px; font-weight: 600; color: var(--on-surface);
  }
  .hv2-card-dist { font-size: 11px; color: var(--on-surface-faint); }

  /* Skeleton loader */
  .hv2-skeleton { background: var(--surface); border-radius: 16px; overflow: hidden; border: 1px solid var(--line); }
  .hv2-skel-img { height: 130px; background: var(--surface-soft); }
  .hv2-skel-line {
    border-radius: 6px;
    background: linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
  }

  /* ═══════════════════════════════════════════════════════
     BOTTOM NAV V2 — red FAB centre
  ═══════════════════════════════════════════════════════ */

  .bottom-nav-v2 {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px;
    background: var(--surface); border-top: 1px solid var(--line);
    display: flex; align-items: center;
    height: 68px; z-index: 100;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
  }
  .bnv2-tab {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 10px 0; font-size: 10px; font-weight: 500;
    color: var(--on-surface-faint); font-family: var(--font-body);
    transition: color 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .bnv2-tab.active { color: var(--orange); }
  .bnv2-fab-wrap {
    width: 70px; display: flex; justify-content: center;
    align-items: center; flex-shrink: 0;
  }
  .bnv2-fab {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--orange); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(229,57,53,0.45);
    position: relative; margin-bottom: 14px;
    transition: transform 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .bnv2-fab:active { transform: scale(0.92); box-shadow: 0 2px 8px rgba(229,57,53,0.3); }
  .bnv2-fab-badge {
    position: absolute; top: -3px; right: -3px;
    background: var(--on-surface); color: white; font-size: 9px;
    font-weight: 700; border-radius: 50%; width: 17px; height: 17px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--surface);
  }

  /* ═══════════════════════════════════════════════════════
     SUCCESS MODAL — grey overlay + white card popup
  ═══════════════════════════════════════════════════════ */

  .success-modal-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(40,40,40,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .success-modal-card {
    background: var(--surface); border-radius: 22px;
    padding: 32px 24px 24px; max-width: 320px; width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .success-modal-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--orange); display: flex; align-items: center;
    justify-content: center; margin: 0 auto 18px;
    box-shadow: 0 8px 20px rgba(229,57,53,0.35);
  }
  .success-modal-title {
    font-family: var(--font-heading); font-weight: 800; font-size: 21px;
    color: var(--orange); margin-bottom: 8px;
  }
  .success-modal-text {
    font-size: 13px; color: var(--on-surface-muted); line-height: 1.6; margin-bottom: 22px;
  }
  .success-modal-btn {
    width: 100%; background: var(--orange); border: none; border-radius: 14px;
    padding: 14px; color: white; font-weight: 700; font-size: 14px;
    cursor: pointer; font-family: var(--font-body);
    box-shadow: 0 6px 16px rgba(229,57,53,0.3);
    transition: transform 0.15s;
  }
  .success-modal-btn:active { transform: scale(0.97); }

  /* ═══════════════════════════════════════════════════════
     PROFILE V2 — red gradient banner + form card
  ═══════════════════════════════════════════════════════ */

  .pv2-banner {
    position: relative;
    background: linear-gradient(135deg, #ff5252 0%, #e53935 60%, #c62828 100%);
    height: calc(150px + var(--sat)); border-radius: 0 0 32px 32px;
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 18px 20px; padding-top: calc(var(--sat) + 18px); overflow: hidden;
  }
  .pv2-banner::before, .pv2-banner::after {
    content: ""; position: absolute; border-radius: 50%;
    background: rgba(255,255,255,0.08);
  }
  .pv2-banner::before { width: 140px; height: 140px; top: -50px; right: -40px; }
  .pv2-banner::after  { width: 90px;  height: 90px;  bottom: -40px; left: -20px; }
  .pv2-back {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.2); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; z-index: 2;
  }
  .pv2-banner-title {
    color: white; font-family: var(--font-heading); font-weight: 700;
    font-size: 16px; position: absolute; left: 50%; top: 22px;
    transform: translateX(-50%); z-index: 2;
  }
  .pv2-avatar-wrap { width: 36px; z-index: 2; }
  .pv2-avatar {
    width: 96px; height: 96px; border-radius: 24px;
    background: var(--surface); border: 4px solid var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-heading); font-weight: 800; font-size: 36px;
    color: var(--orange); position: absolute; left: 50%; bottom: -48px;
    transform: translateX(-50%); box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 3;
  }

  .pv2-card { padding: 64px 20px 0; }

  .pv2-stats {
    display: flex; align-items: center; justify-content: center; gap: 24px;
    background: var(--chip-bg); border: 1.5px solid var(--chip-line); border-radius: 16px;
    padding: 14px; margin-bottom: 22px;
  }
  .pv2-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .pv2-stat-num { font-family: var(--font-heading); font-weight: 800; font-size: 18px; color: var(--on-surface); }
  .pv2-stat-label { font-size: 11px; color: var(--on-surface-muted); }
  .pv2-stat-divider { width: 1px; height: 28px; background: var(--chip-line); }

  .pv2-field { margin-bottom: 14px; }
  .pv2-label { display: block; font-size: 11px; font-weight: 600; color: var(--on-surface-faint); margin-bottom: 5px; letter-spacing: 0.2px; }
  .pv2-input {
    width: 100%; box-sizing: border-box;
    background: var(--surface-alt); border: 1.5px solid var(--line); border-radius: 12px;
    padding: 12px 14px; font-size: 14px; color: var(--on-surface);
    font-family: var(--font-body); outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .pv2-input:focus { border-color: var(--orange); background: var(--surface); }
  .pv2-input:disabled, .pv2-input[type="email"] { color: var(--on-surface-muted); }

  .pv2-error { color: var(--orange); font-size: 12px; margin-bottom: 12px; }

  .pv2-divider { height: 1px; background: var(--line); margin: 16px 0; }

  .pv2-row {
    width: 100%; display: flex; align-items: center; gap: 12px;
    background: none; border: none; cursor: pointer;
    padding: 13px 4px; font-family: var(--font-body);
    border-bottom: 1px solid var(--line-soft);
  }
  .pv2-row:last-of-type { border-bottom: none; }
  .pv2-row-icon { font-size: 18px; }
  .pv2-row-label { flex: 1; text-align: left; font-size: 14px; font-weight: 500; color: var(--on-surface); }

  .pv2-actions { display: flex; gap: 10px; margin-top: 24px; }
  .pv2-edit-btn {
    flex: 1.3; background: var(--dark-btn); border: none; border-radius: 14px;
    padding: 14px; color: white; font-weight: 700; font-size: 14px;
    cursor: pointer; font-family: var(--font-body);
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.15s;
  }
  .pv2-edit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pv2-logout-btn {
    flex: 1; background: var(--surface); border: 1.5px solid var(--orange); border-radius: 14px;
    padding: 14px; color: var(--orange); font-weight: 700; font-size: 14px;
    cursor: pointer; font-family: var(--font-body);
    display: flex; align-items: center; justify-content: center;
  }

  /* ═══════════════════════════════════════════════════════
     CART V2 — order summary + payment methods + pay bar
  ═══════════════════════════════════════════════════════ */

  .cart-v2 { background: var(--surface); min-height: 100svh; padding-top: 16px; }

  .cv2-section-title {
    font-family: var(--font-heading); font-weight: 700; font-size: 14px;
    color: var(--on-surface); margin: 18px 0 10px;
  }

  .cv2-summary {
    background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 14px;
    padding: 14px 16px;
  }
  .cv2-summary-row {
    display: flex; justify-content: space-between; font-size: 13px;
    color: var(--on-surface-muted); padding: 5px 0;
  }
  .cv2-summary-divider { height: 1px; background: var(--line); margin: 6px 0; }
  .cv2-summary-total {
    font-family: var(--font-heading); font-weight: 800; font-size: 16px;
    color: var(--on-surface);
  }
  .cv2-summary-total span:last-child { color: var(--orange); }

  .cv2-pay-list { display: flex; flex-direction: column; gap: 10px; }
  .cv2-pay-opt {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface); border: 1.5px solid var(--line); border-radius: 14px;
    padding: 12px 14px; cursor: pointer; text-align: left;
    font-family: var(--font-body); transition: all 0.15s;
  }
  .cv2-pay-opt.active { border-color: var(--orange); background: var(--chip-bg); }
  .cv2-pay-opt.disabled { opacity: 0.45; cursor: not-allowed; }
  .cv2-pay-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--surface-alt); display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .cv2-pay-text { flex: 1; display: flex; flex-direction: column; }
  .cv2-pay-label { font-size: 13px; font-weight: 700; color: var(--on-surface); }
  .cv2-pay-detail { font-size: 11px; color: var(--on-surface-faint); margin-top: 1px; }
  .cv2-radio {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--line); flex-shrink: 0; transition: all 0.15s;
    position: relative;
  }
  .cv2-radio.checked {
    border-color: var(--orange);
    background: radial-gradient(circle, var(--orange) 0 40%, transparent 42%);
  }

  /* Mini card-brand icons for "Card" option */
  .pm-card-icons { display: flex; align-items: center; gap: 2px; }
  .pm-mc {
    width: 18px; height: 18px; border-radius: 50%; background: #eb001b;
    box-shadow: 6px 0 0 -2px #f79e1b; opacity: 0.9;
  }
  .pm-visa {
    font-size: 9px; font-weight: 800; font-style: italic; color: #1a1f71;
    margin-left: 8px; letter-spacing: 0.5px;
  }

  /* Sticky bottom pay bar */
  .cv2-bottom-bar {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; box-sizing: border-box;
    background: var(--surface); border-top: 1px solid var(--line);
    padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
    display: flex; align-items: center; gap: 14px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    z-index: 90;
  }
  .cv2-bottom-total { display: flex; flex-direction: column; }
  .cv2-bottom-total-label { font-size: 11px; color: var(--on-surface-faint); }
  .cv2-bottom-total-amount { font-family: var(--font-heading); font-weight: 800; font-size: 18px; color: var(--on-surface); }
  .cv2-pay-btn {
    flex: 1; background: var(--dark-btn); border: none; border-radius: 14px;
    padding: 15px; color: white; font-weight: 700; font-size: 15px;
    cursor: pointer; font-family: var(--font-body);
    transition: opacity 0.15s;
  }
  .cv2-pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .cv2-pay-btn:active { transform: scale(0.98); }

  /* ═══════════════════════════════════════════════════════
     ORDERS V2 — order tracking cards
  ═══════════════════════════════════════════════════════ */

  .orders-v2 { padding-bottom: 100px; }

  .ov2-header { padding: 18px 20px 14px; }
  .ov2-title {
    font-family: var(--font-heading); font-weight: 800; font-size: 24px;
    color: var(--on-surface); margin-bottom: 14px;
  }
  .ov2-tabs { display: flex; gap: 8px; }
  .ov2-tab {
    flex: 1; padding: 10px 0; border-radius: 12px;
    border: 1.5px solid var(--line); background: var(--surface);
    color: var(--on-surface-muted); font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: var(--font-body);
    transition: all 0.18s;
  }
  .ov2-tab.active {
    background: var(--orange); border-color: var(--orange); color: white;
    box-shadow: 0 4px 12px rgba(229,57,53,0.28);
  }

  .ov2-list { padding: 0 20px; display: flex; flex-direction: column; gap: 14px; }

  .ov2-empty {
    text-align: center; padding: 60px 20px; color: var(--on-surface-faint);
  }
  .ov2-empty-emoji { font-size: 40px; margin-bottom: 10px; }
  .ov2-empty p { font-weight: 700; color: var(--muted); font-size: 14px; }
  .ov2-empty span { font-size: 12px; color: var(--on-surface-faint); }

  /* Order card */
  .ov2-card {
    background: var(--surface); border: 1.5px solid var(--line); border-radius: 18px;
    padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .ov2-live-badge {
    font-size: 10px; font-weight: 700; color: var(--orange);
    letter-spacing: 0.4px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 4px;
    animation: pulse 1.5s infinite;
  }
  .ov2-card-header { display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .ov2-card-emoji {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--chip-bg); display: flex; align-items: center;
    justify-content: center; font-size: 20px; flex-shrink: 0;
  }
  .ov2-card-vendor {
    font-weight: 700; font-size: 14px; color: var(--on-surface);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ov2-card-meta { font-size: 12px; color: var(--on-surface-faint); margin-top: 1px; }
  .ov2-status-pill {
    font-size: 11px; font-weight: 700; padding: 5px 10px;
    border-radius: 100px; white-space: nowrap; flex-shrink: 0;
  }

  /* Status tracker */
  .ov2-tracker { display: flex; align-items: flex-start; margin: 16px 4px 4px; }
  .ov2-tracker-step { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; }
  .ov2-tracker-dot {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--surface-soft); color: var(--on-surface-faint);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; z-index: 1;
    border: 2px solid var(--surface-soft); transition: all 0.2s;
  }
  .ov2-tracker-dot.done { background: var(--orange); border-color: var(--orange); color: white; }
  .ov2-tracker-dot.current { background: var(--surface); border-color: var(--orange); color: var(--orange); animation: pulse 1.5s infinite; }
  .ov2-tracker-label { font-size: 9px; color: var(--on-surface-faint); margin-top: 4px; text-align: center; }
  .ov2-tracker-label.done { color: var(--orange); font-weight: 600; }
  .ov2-tracker-line {
    position: absolute; top: 12px; left: 50%; right: -50%;
    height: 2px; background: var(--line); z-index: 0;
  }
  .ov2-tracker-line.done { background: var(--orange); }

  /* Items */
  .ov2-items { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line-soft); }
  .ov2-item-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); padding: 3px 0; }
  .ov2-item-qty { color: var(--orange); font-weight: 700; margin-right: 2px; }

  /* Footer */
  .ov2-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line-soft);
  }
  .ov2-expand-btn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 600; color: var(--on-surface-muted);
    font-family: var(--font-body); padding: 0;
  }
  .ov2-total { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--on-surface-faint); }
  .ov2-total-amount { font-family: var(--font-heading); font-weight: 800; font-size: 15px; color: var(--on-surface); }

  /* Inline review box */
  .ov2-review-box {
    margin-top: 12px; padding: 14px; background: var(--chip-bg);
    border: 1.5px solid var(--chip-line); border-radius: 14px;
  }
  .ov2-review-title { font-size: 13px; font-weight: 700; color: var(--on-surface); margin-bottom: 8px; }
  .ov2-review-submit {
    margin-top: 10px; width: 100%; background: var(--orange); border: none;
    border-radius: 12px; padding: 11px; color: white; font-weight: 700;
    font-size: 13px; cursor: pointer; font-family: var(--font-body);
  }
  .ov2-review-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .ov2-reviewed-note {
    margin-top: 12px; font-size: 12px; color: #22c55e; font-weight: 600;
    text-align: center; padding: 8px; background: rgba(34,197,94,0.12); border-radius: 10px;
  }

  @media (min-width: 520px) {
    body:not(.pwa-standalone) { padding: 18px 0; }
    body:not(.pwa-standalone) .kivo-root {
      min-height: calc(100svh - 36px);
      height: calc(100svh - 36px);
      border-radius: 28px;
    }
    .navbar, .bottom-nav { max-width: 420px; }
    body:not(.pwa-standalone) .navbar { top: 18px; }
    body:not(.pwa-standalone) .bottom-nav { bottom: 18px; border-radius: 0 0 28px 28px; overflow: hidden; }
    body:not(.pwa-standalone) .main-content { height: calc(100svh - 36px); min-height: calc(100svh - 36px); }
    .toast { bottom: 42px; }
  }

  @media (max-width: 360px) {
    .greeting-main { font-size: 25px; }
    .vendor-card { min-height: 118px; }
    .vendor-img { width: 88px; font-size: 38px; }
    .menu-item { padding: 12px; margin-inline: 12px; }
    .menu-item-emoji { width: 46px; font-size: 36px; }
    .vendor-meta { gap: 7px; }
  }

  /* ═══════════════════════════════════════════════════════
     DARK MODE — flips every theme token. Toggled by setting
     data-theme="dark" on <html> (see ThemeContext.jsx).
  ═══════════════════════════════════════════════════════ */
  [data-theme="dark"] {
    --card: #1c1c1e;
    --bg: #121214;
    --border: #2c2c2e;
    --text: #f2f2f2;
    --muted: #9a958d;
    --green-soft: rgba(16,185,129,0.18);
    --red-soft: rgba(239,68,68,0.18);
    --yellow-soft: rgba(245,158,11,0.18);
    --orange-soft: rgba(229,57,53,0.18);
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.35);
    --shadow-md: 0 12px 30px rgba(0,0,0,0.5);

    /* v2 surface tokens */
    --surface: #1c1c1e;
    --surface-alt: #262628;
    --surface-soft: #232325;
    --surface-2: #202022;
    --on-surface: #f2f2f2;
    --on-surface-muted: #9a958d;
    --on-surface-faint: #6e6a64;
    --line: #2e2e30;
    --line-soft: #262628;
    --chip-bg: rgba(229,57,53,0.16);
    --chip-line: rgba(229,57,53,0.3);
    --skeleton-base: #2a2a2c;
    --skeleton-shine: #343436;
    --dark-btn: #f2f2f2;
  }

  [data-theme="dark"] html { background: #0c0c0d; }

  [data-theme="dark"] .kivo-root { box-shadow: 0 0 60px rgba(0,0,0,0.6); }

  /* Buttons that were "dark on light" need to flip to "light on dark" */
  [data-theme="dark"] .pv2-edit-btn,
  [data-theme="dark"] .cv2-pay-btn {
    background: var(--dark-btn); color: #121214;
  }

  /* Avatar / icon glyphs that assumed a white circle */
  [data-theme="dark"] .pv2-avatar { background: var(--surface); border-color: var(--surface); }
  [data-theme="dark"] .hv2-avatar { background: var(--surface-alt); border-color: var(--line); }

  /* Card images / gradients that assumed light backdrops */
  [data-theme="dark"] .hv2-card-img {
    background: linear-gradient(135deg, var(--chip-bg) 0%, var(--surface-alt) 100%);
  }
  [data-theme="dark"] .vendor-img {
    background: linear-gradient(135deg, #232325, #1a1a1c);
  }

  /* Inputs that need to stay readable on dark surfaces */
  [data-theme="dark"] .av2-input:focus,
  [data-theme="dark"] .pv2-input:focus { background: var(--surface-alt); }

  /* Success modal stays legible — keep its icon/button red, just adjust card */
  [data-theme="dark"] .success-modal-card { background: var(--surface); }

  /* Status track + order tracking dots already use var(); just deepen shadow */
  [data-theme="dark"] .ov2-card,
  [data-theme="dark"] .hv2-card,
  [data-theme="dark"] .vorder-card,
  [data-theme="dark"] .vm-item-row {
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  /* Boot/loading screen background */
  [data-theme="dark"] .boot-screen { background: var(--bg); color: var(--text); }
`;

export default CSS;
