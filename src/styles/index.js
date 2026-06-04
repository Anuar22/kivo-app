const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --orange: #ff6b35;
    --orange-soft: #fff1ec;
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
    --shadow-sm: 0 1px 2px rgba(15,15,15,0.04), 0 8px 20px rgba(15,15,15,0.05);
    --shadow-md: 0 12px 30px rgba(15,15,15,0.11);
  }

  html { background: #ece7df; }
  body {
    font-family: 'DM Sans', sans-serif;
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
    outline: 3px solid rgba(255,107,53,0.28);
    outline-offset: 2px;
  }

  .kivo-root {
    width: 100%; max-width: 420px; margin: 0 auto;
    background: var(--bg); min-height: 100svh;
    position: relative; overflow: hidden;
    box-shadow: 0 0 60px rgba(0,0,0,0.14);
  }

  /* ── ACCOUNT ENTRY ── */
  .auth-screen {
    min-height: 100svh;
    background:
      linear-gradient(145deg, rgba(255,107,53,0.18), rgba(255,255,255,0) 44%),
      linear-gradient(135deg, #141414 0%, #2a190d 100%);
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: white;
  }
  .auth-brand { margin-bottom: 28px; }
  .auth-logo { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; line-height: 1; margin-bottom: 8px; }
  .auth-logo span { color: var(--orange); }
  .auth-brand p { color: rgba(255,255,255,0.62); font-size: 14px; line-height: 1.45; max-width: 310px; }
  .auth-panel {
    background: rgba(255,255,255,0.96);
    color: var(--text);
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.26);
  }
  .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--bg); padding: 4px; border-radius: 12px; margin-bottom: 14px; }
  .auth-tab { border: none; border-radius: 9px; padding: 10px; background: transparent; color: var(--muted); font-size: 13px; font-weight: 700; cursor: pointer; }
  .auth-tab.active { background: var(--card); color: var(--text); box-shadow: var(--shadow-sm); }
  .role-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .role-choice button {
    border: 1.5px solid var(--border);
    background: var(--card);
    border-radius: 12px;
    padding: 11px 10px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .role-choice button.active { border-color: var(--orange); color: var(--orange); background: var(--orange-soft); }
  .auth-form { display: flex; flex-direction: column; gap: 10px; }
  .auth-input {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 13px 14px;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    outline: none;
  }
  .auth-input:focus { border-color: var(--orange); background: white; }
  .auth-error {
    background: var(--red-soft);
    color: #991b1b;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 9px 11px;
    font-size: 12px;
    line-height: 1.4;
  }
  .auth-submit {
    border: none;
    border-radius: 13px;
    padding: 14px;
    background: linear-gradient(135deg, #ff6b35, #e55a20);
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 26px rgba(255,107,53,0.3);
  }
  .auth-submit:disabled { opacity: 0.65; cursor: wait; }
  .auth-hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin-top: 12px; }
  .boot-screen { min-height: 100svh; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; }

  /* ── ROLE SWITCHER ── */
  .role-switcher {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; z-index: 200;
    background: rgba(15,15,15,0.96); display: flex; align-items: center;
    padding: 0 16px; height: 36px; gap: 8px;
    backdrop-filter: blur(16px);
  }
  .role-label { font-size: 10px; color: rgba(255,255,255,0.35); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0; }
  .role-btn {
    min-height: 26px; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);
    background: none; color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap;
  }
  .role-btn.active { background: var(--orange); border-color: var(--orange); color: white; box-shadow: 0 6px 16px rgba(255,107,53,0.24); }
  .account-menu { position: relative; }
  .account-popover {
    position: absolute; top: 31px; left: 0; width: 260px; background: var(--card); color: var(--text);
    border: 1px solid var(--border); border-radius: 14px; padding: 12px;
    box-shadow: 0 18px 45px rgba(0,0,0,0.22); z-index: 250;
  }
  .account-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; margin-bottom: 3px; }
  .account-email { color: var(--muted); font-size: 12px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .account-popover button {
    width: 100%; border: 1px solid #fecaca; background: #fff5f5; color: var(--red);
    border-radius: 10px; padding: 9px 12px; font-size: 13px; font-weight: 700; cursor: pointer;
  }

  /* ── CUSTOMER LAYOUT ── */
  .navbar {
    position: fixed; top: 36px; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; height: var(--nav-h);
    background: rgba(247,245,242,0.9); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border); z-index: 100;
    display: flex; align-items: center;
  }
  .nav-inner { width: 100%; display: flex; align-items: center; padding: 0 16px; }
  .nav-home { justify-content: space-between; }
  .nav-page { justify-content: space-between; }
  .nav-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; line-height: 1; }
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
  .nav-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px; }

  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; height: var(--bot-h);
    background: rgba(247,245,242,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid var(--border); z-index: 100;
    display: flex; align-items: center;
  }
  .bottom-tab {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    min-height: 58px; padding: 8px 0; color: var(--muted); font-size: 11px; font-family: 'DM Sans', sans-serif;
    transition: color 0.2s, transform 0.18s ease; font-weight: 500;
  }
  .bottom-tab.active { color: var(--orange); }
  .bottom-tab svg { transition: transform 0.2s; }
  .bottom-tab.active svg { transform: translateY(-2px); }

  .main-content {
    padding-top: calc(var(--nav-h) + 36px); padding-bottom: var(--bot-h);
    min-height: 100svh; height: 100svh; overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .page { padding: 0; }

  /* ── HOME ── */
  .home-hero {
    background:
      linear-gradient(145deg, rgba(255,107,53,0.18), rgba(255,255,255,0) 42%),
      linear-gradient(135deg, #141414 0%, #2a190d 100%);
    padding: 26px 16px 28px; position: relative; overflow: hidden;
  }
  .home-hero::before {
    content: '🍽️'; position: absolute; top: 18px; right: 18px;
    font-size: 74px; line-height: 1; opacity: 0.12; transform: rotate(-10deg);
  }
  .greeting-sub { color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 4px; }
  .greeting-main { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; color: white; line-height: 1.2; margin-bottom: 20px; }
  .greeting-main em { color: var(--orange); font-style: normal; }
  .search-bar {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 14px; display: flex; align-items: center;
    padding: 12px 14px; gap: 10px; backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .search-bar svg { color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .search-bar input { flex: 1; background: none; border: none; outline: none; color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; }
  .search-bar input::placeholder { color: rgba(255,255,255,0.4); }
  .clear-search { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px; padding: 2px; }
  .promo-banner {
    margin: 16px; border-radius: var(--radius);
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 12px 30px rgba(255,107,53,0.28);
  }
  .promo-text .promo-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; background: rgba(255,255,255,0.25); border-radius: 20px; padding: 2px 8px; color: white; display: inline-block; margin-bottom: 6px; }
  .promo-text h3 { color: white; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .promo-text p { color: rgba(255,255,255,0.85); font-size: 12px; }
  .promo-art { font-size: 40px; }
  .section { padding: 0 0 8px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 10px; }
  .section-header h2 { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; }
  .section-count { font-size: 12px; color: var(--muted); }
  .categories-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .categories-scroll::-webkit-scrollbar { display: none; }
  .cat-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--card); white-space: nowrap; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: all 0.2s; flex-shrink: 0; }
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
  .vendor-header h3 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
  .vendor-rating { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .vendor-category { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .vendor-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .vendor-meta span { font-size: 11px; color: var(--muted); }
  .empty-state { text-align: center; padding: 40px 16px; }
  .empty-state p { font-size: 18px; margin-bottom: 8px; font-weight: 600; }
  .empty-state span { color: var(--muted); font-size: 14px; }

  /* ── VENDOR PAGE ── */
  .vendor-hero { background: linear-gradient(145deg, rgba(255,107,53,0.16), rgba(255,255,255,0) 42%), linear-gradient(135deg, #141414, #2a190d); padding: 24px 16px; position: relative; min-height: 200px; display: flex; flex-direction: column; justify-content: flex-end; }
  .vendor-hero-art { font-size: 80px; position: absolute; top: 20px; right: 20px; opacity: 0.35; }
  .vendor-hero-overlay { position: relative; z-index: 1; }
  .vendor-hero-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: white; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 8px; }
  .vendor-hero-overlay h2 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: white; margin-bottom: 6px; }
  .vendor-hero-overlay p { color: rgba(255,255,255,0.65); font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
  .vendor-hero-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vendor-hero-meta span { font-size: 12px; color: rgba(255,255,255,0.8); }
  .vendor-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; }
  .vtab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.2s; }
  .vtab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .menu-content { padding: 8px 0; }
  .menu-section { padding: 8px 0; }
  .menu-section-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; padding: 12px 16px 8px; }
  .menu-item { display: flex; gap: 12px; padding: 14px 16px; background: var(--card); margin: 0 16px 10px; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .menu-item-emoji { font-size: 44px; flex-shrink: 0; width: 56px; display: flex; align-items: center; justify-content: center; }
  .menu-item-info { flex: 1; min-width: 0; }
  .menu-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
  .menu-item-top h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; min-width: 0; }
  .popular-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; background: var(--orange-soft); color: var(--orange); padding: 2px 7px; border-radius: 6px; }
  .menu-item-info p { font-size: 12px; color: var(--muted); line-height: 1.4; margin-bottom: 10px; }
  .menu-item-bottom { display: flex; justify-content: space-between; align-items: center; }
  .menu-item-price { font-weight: 700; color: var(--orange); font-size: 15px; }
  .add-btn { background: var(--orange); color: white; border: none; border-radius: 10px; min-width: 70px; min-height: 34px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s, transform 0.18s ease; }
  .add-btn:hover { background: #e55a20; }
  .qty-control { display: flex; align-items: center; gap: 10px; background: var(--black); border-radius: 10px; padding: 6px 10px; }
  .qty-control button { background: none; border: none; color: white; font-size: 16px; cursor: pointer; width: 20px; display: flex; align-items: center; justify-content: center; }
  .qty-control span { color: white; font-weight: 700; font-size: 14px; min-width: 16px; text-align: center; }
  .reviews-content { padding: 16px; }
  .reviews-summary { display: flex; align-items: center; gap: 16px; background: var(--card); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; border: 1px solid var(--border); }
  .reviews-score { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: var(--orange); line-height: 1; }
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
  .cart-vendor-label { background: var(--orange-soft); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .cart-items { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
  .cart-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .cart-item-emoji { font-size: 32px; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .cart-item-price { font-size: 13px; color: var(--orange); font-weight: 600; }
  .cart-section { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .cart-section h3 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 12px; }
  .address-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; background: var(--bg); }
  .address-input:focus { border-color: var(--orange); }
  .cart-error { margin-top: 10px; background: var(--red-soft); border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; padding: 9px 11px; font-size: 12px; line-height: 1.4; }
  .payment-options { display: flex; flex-direction: column; gap: 8px; }
  .payment-opt { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 12px; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s; background: none; }
  .payment-opt.active { border-color: var(--orange); background: var(--orange-soft); }
  .payment-opt.disabled { opacity: 0.5; cursor: not-allowed; }
  .coming-soon { margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; background: var(--border); border-radius: 6px; padding: 2px 8px; }
  .cart-summary { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .summary-row span:first-child { color: var(--muted); }
  .total-row { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 700; }
  .btn-primary { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg, #ff6b35, #e55a20); color: white; font-size: 16px; font-weight: 700; font-family: 'Syne', sans-serif; cursor: pointer; box-shadow: 0 8px 24px rgba(255,107,53,0.4); transition: all 0.2s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,107,53,0.5); }
  .btn-primary:disabled { opacity: 0.7; cursor: wait; transform: none; }
  .btn-secondary { width: 100%; padding: 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--card); color: var(--text); font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; }
  .place-order-btn { margin-bottom: 16px; }
  .empty-cart { text-align: center; padding: 60px 16px; }
  .empty-cart-icon { font-size: 60px; margin-bottom: 16px; display: block; }
  .empty-cart h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-cart p { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
  .order-success { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
  .success-animation { text-align: center; padding: 24px; }
  .success-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(16,185,129,0.4); animation: scaleIn 0.4s ease; }
  @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
  .success-animation h2 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 10px; }
  .success-animation p { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
  .success-loader { background: var(--border); border-radius: 4px; height: 4px; overflow: hidden; }
  .success-bar { height: 100%; background: var(--orange); border-radius: 4px; animation: load 2.5s linear; }
  @keyframes load { from { width: 0%; } to { width: 100%; } }

  /* ── CUSTOMER ORDERS ── */
  .orders-page { padding: 0; }
  .orders-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; position: sticky; top: calc(var(--nav-h) + 36px); z-index: 10; }
  .otab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
  .otab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .otab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .orders-list { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .order-card { background: var(--card); border-radius: var(--radius); padding: 16px; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: var(--shadow-sm); }
  .order-card.order-live { border-color: rgba(255,107,53,0.3); }
  .live-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--orange); margin-bottom: 10px; display: flex; align-items: center; gap: 4px; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .order-vendor { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 3px; }
  .order-id { font-size: 11px; color: var(--muted); }
  .order-status-badge { font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 20px; white-space: nowrap; }
  .status-track { display: flex; align-items: flex-start; background: var(--bg); border-radius: 12px; padding: 14px; margin-bottom: 14px; overflow-x: auto; gap: 0; scrollbar-width: none; }
  .status-track::-webkit-scrollbar { display: none; }
  .track-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; position: relative; min-width: 56px; }
  .track-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--border); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: all 0.4s; color: var(--muted); z-index: 1; position: relative; }
  .track-step.done .track-dot { background: var(--green); border-color: var(--green); color: white; }
  .track-step.current .track-dot { background: var(--orange); border-color: var(--orange); color: white; box-shadow: 0 0 0 4px rgba(255,107,53,0.2); }
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
  .profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), #ff8c42); color: white; font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(255,107,53,0.4); }
  .profile-info h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
  .profile-info p { color: rgba(255,255,255,0.6); font-size: 13px; }
  .profile-stats { background: var(--card); margin: 16px; border-radius: var(--radius); display: flex; align-items: center; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .profile-stat { flex: 1; padding: 16px; text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; display: block; margin-bottom: 2px; }
  .stat-label { font-size: 11px; color: var(--muted); }
  .stat-divider { width: 1px; height: 40px; background: var(--border); }
  .profile-section { margin: 0 16px 12px; }
  .profile-section-title { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); padding: 0 0 8px; }
  .profile-list { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
  .profile-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: none; background: none; cursor: pointer; border-bottom: 1px solid var(--border); font-family: 'DM Sans', sans-serif; font-size: 14px; text-align: left; transition: background 0.15s; }
  .profile-item:last-child { border-bottom: none; }
  .profile-item:hover { background: var(--bg); }
  .profile-item-icon { font-size: 20px; }
  .profile-item-label { flex: 1; font-weight: 500; }
  .profile-item-arrow { color: var(--muted); font-size: 20px; }
  .logout-btn { margin: 16px; width: calc(100% - 32px); padding: 14px; border-radius: var(--radius); border: 1.5px solid #ef4444; background: none; color: #ef4444; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
  .logout-btn:hover { background: #fef2f2; }

  /* ── VENDOR DASHBOARD ── */
  .vd-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 32px; }
  .vd-header {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d1a0a 100%);
    padding: 20px 16px 0;
    position: sticky; top: 36px; z-index: 50;
  }
  .vd-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .vd-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; }
  .vd-logo span { color: var(--orange); }
  .vd-logo em { color: white; font-style: normal; }
  .vendor-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; padding: 6px 12px; font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .vd-tabs { display: flex; gap: 0; }
  .vd-tab { flex: 1; padding: 12px 6px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .vd-tab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .tab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { background: var(--card); border-radius: 10px; border: 1px solid var(--border); padding: 14px; }
  .stat-card .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-card .stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .stat-card .stat-value.orange { color: var(--orange); }
  .stat-card .stat-value.green { color: var(--green); }
  .stat-card .stat-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .vd-section-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .vorder-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm); }
  .vorder-card-header { padding: 14px 16px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
  .vorder-card-id { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .vorder-card-customer { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .vorder-card-time { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .vorder-status-pill { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .vpill-pending { background: var(--yellow-soft); color: #92400e; }
  .vpill-cooking { background: var(--orange-soft); color: #9a3412; }
  .vpill-ready { background: var(--green-soft); color: #065f46; }
  .vorder-items-list { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .vorder-item-row { display: flex; justify-content: space-between; font-size: 13px; }
  .vorder-item-row .qty { color: var(--orange); font-weight: 600; margin-right: 4px; }
  .vorder-item-row .price { color: var(--muted); }
  .vorder-card-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .vorder-total-label { font-size: 12px; color: var(--muted); }
  .vorder-total-amount { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; }
  .action-btns { display: flex; gap: 8px; }
  .btn-accept { background: var(--green); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .btn-accept:hover { opacity: 0.85; }
  .btn-reject { background: var(--red-soft); color: var(--red); border: 1px solid #fca5a5; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .btn-reject:hover { opacity: 0.75; }
  .btn-advance { background: var(--orange); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; flex: 1; }
  .btn-advance:hover { opacity: 0.85; }
  .empty-orders { text-align: center; padding: 48px 0; }
  .empty-orders .emoji { font-size: 48px; margin-bottom: 12px; }
  .empty-orders p { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .empty-orders span { font-size: 13px; color: var(--muted); }

  /* VENDOR MENU MANAGEMENT */
  .vm-item-row { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
  .mi-emoji { font-size: 36px; flex-shrink: 0; }
  .mi-info { flex: 1; min-width: 0; }
  .mi-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
  .mi-desc { font-size: 12px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mi-price { font-size: 14px; font-weight: 700; color: var(--orange); margin-top: 4px; }
  .mi-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .toggle { width: 40px; height: 22px; border-radius: 11px; background: #d1d0cc; border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .toggle.on { background: var(--green); }
  .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle.on::after { transform: translateX(18px); }
  .btn-edit { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--muted); font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-edit:hover { border-color: var(--orange); color: var(--orange); }
  .btn-add-item { width: 100%; background: var(--orange-soft); color: var(--orange); border: 1.5px dashed var(--orange); border-radius: var(--radius); padding: 14px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
  .btn-add-item:hover { background: #ffe4d6; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; max-width: 420px; left: 50%; transform: translateX(-50%); }
  .modal-sheet { background: var(--card); border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; animation: slideUp 0.25s ease; }
  .confirm-sheet { background: var(--card); border-radius: 20px 20px 0 0; padding: 22px 18px 28px; width: 100%; animation: slideUp 0.25s ease; }
  .confirm-sheet h2 { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; margin-bottom: 8px; }
  .confirm-sheet p { color: var(--muted); font-size: 14px; line-height: 1.45; margin-bottom: 16px; }
  .confirm-actions { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .modal-close { background: var(--bg); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: 0.4px; }
  .form-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--orange); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-save { width: 100%; background: var(--orange); color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 8px; transition: opacity 0.2s; }
  .btn-save:hover { opacity: 0.9; }

  /* TOAST */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--black); color: white; padding: 10px 18px; border-radius: 100px; font-size: 13px; font-weight: 500; z-index: 999; white-space: nowrap; animation: toastIn 0.25s ease; max-width: 360px; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  @media (min-width: 520px) {
    body { padding: 18px 0; }
    .kivo-root {
      min-height: calc(100svh - 36px);
      height: calc(100svh - 36px);
      border-radius: 28px;
    }
    .role-switcher, .navbar, .bottom-nav, .modal-overlay { max-width: 420px; }
    .role-switcher { top: 18px; border-radius: 28px 28px 0 0; overflow: hidden; }
    .navbar { top: 54px; }
    .bottom-nav { bottom: 18px; border-radius: 0 0 28px 28px; overflow: hidden; }
    .main-content { height: calc(100svh - 36px); min-height: calc(100svh - 36px); }
    .toast { bottom: 42px; }
  }

  @media (max-width: 360px) {
    .role-switcher { padding: 0 12px; gap: 6px; }
    .role-btn { padding-inline: 9px; }
    .greeting-main { font-size: 25px; }
    .vendor-card { min-height: 118px; }
    .vendor-img { width: 88px; font-size: 38px; }
    .menu-item { padding: 12px; margin-inline: 12px; }
    .menu-item-emoji { width: 46px; font-size: 36px; }
    .vendor-meta { gap: 7px; }
  }
`;

export default CSS;
