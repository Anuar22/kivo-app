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
    /* Body/UI font. */
    --font-body: 'Helvetica Now', -apple-system, 'San Francisco', 'Proxima Nova', Roboto, Poppins, 'Open Sans', sans-serif;

    /* Pitch-Black Global Theme Tokens */
    --orange: #e53935;
    --orange-soft: rgba(229, 57, 53, 0.15);
    --black: #000000;
    --dark: #121212;
    --card: #1a1a1a;
    --bg: #000000;
    --border: #222222;
    --text: #ffffff;
    --muted: #a0a0a0;
    --green: #10b981;
    --green-soft: rgba(16, 185, 129, 0.18);
    --red: #ef4444;
    --red-soft: rgba(239, 68, 68, 0.18);
    --yellow: #f59e0b;
    --yellow-soft: rgba(245, 158, 11, 0.18);
    --radius: 12px;
    --nav-h: 60px;
    --bot-h: 68px;
    
    /* Safe area insets for PWA standalone mode */
    --sat: env(safe-area-inset-top, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
    --sar: env(safe-area-inset-right, 0px);
    /* Pre-computed nav height + safe area, so nothing needs to nest calc() inside calc() */
    --nav-total: calc(var(--nav-h) + var(--sat));
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.35);
    --shadow-md: 0 12px 30px rgba(0,0,0,0.5);

    /* v2 surface tokens shifted to midnight styling context */
    --surface: #000000;
    --surface-alt: #121212;
    --surface-soft: #1a1a1a;
    --surface-2: #161616;
    --on-surface: #ffffff;
    --on-surface-muted: #a0a0a0;
    --on-surface-faint: #444444;
    --line: #222222;
    --line-soft: #1c1c1c;
    --chip-bg: rgba(229, 57, 53, 0.18);
    --chip-line: #331111;
    --skeleton-base: #2a2a2c;
    --skeleton-shine: #343436;
    --dark-btn: #ffffff;
  }

  html { background: #000000; }
  body {
    font-family: var(--font-body);
    background: var(--bg);
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
    box-shadow: 0 0 60px rgba(0,0,0,0.6);
  }

  /* ── AUTH V2 ── */
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
    padding: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
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
  .av2-tab.active { background: var(--surface-soft); color: var(--on-surface); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

  .av2-role-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .av2-role-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px;
    padding: 14px 10px; color: var(--on-surface-muted); font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: var(--font-body); transition: all 0.18s;
  }
  .av2-role-icon { font-size: 22px; }
  .av2-role-btn.active { border-color: var(--orange); color: var(--on-surface); background: var(--chip-bg); }

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
  .av2-input:focus { border-color: var(--orange); background: var(--surface-alt); }
  .av2-input::placeholder { color: var(--on-surface-faint); }

  .av2-input-wrap { position: relative; display: flex; align-items: center; }
  .av2-input-wrap .av2-input { padding-right: 42px; }
  .av2-eye-btn {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; padding: 6px; margin: 0; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--on-surface-faint);
  }
  .av2-eye-btn:hover { color: var(--on-surface); }

  .av2-error {
    background: var(--chip-bg); color: #ef5350; border: 1px solid #5c1d1d;
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

  .av2-back {
    background: none; border: none; cursor: pointer; padding: 0;
    display: flex; align-items: center; gap: 6px;
    color: var(--on-surface-muted); font-size: 13px; font-weight: 600;
    font-family: var(--font-body); margin-bottom: 18px;
  }

  .av2-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 18px 0; color: var(--on-surface-faint); font-size: 12px; font-weight: 600;
  }
  .av2-divider::before, .av2-divider::after {
    content: ""; flex: 1; height: 1px; background: var(--line);
  }

  .av2-google-btn {
    width: 100%; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    border: 1.5px solid var(--line); border-radius: 14px; padding: 13px;
    background: var(--surface); color: var(--on-surface);
    font-family: var(--font-body); font-size: 14px; font-weight: 700;
    cursor: pointer; transition: background 0.15s, transform 0.15s;
  }
  .av2-google-btn:hover { background: var(--surface-alt); }
  .av2-google-btn:active { transform: scale(0.98); }
  .av2-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .boot-screen { min-height: 100svh; display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-weight: 800; background: var(--bg); color: var(--text); }

  /* ── ACCOUNT POPOVER ── */
  .account-menu { position: relative; }
  .account-popover {
    position: absolute; top: 31px; left: 0; width: 260px; background: var(--card); color: var(--text);
    border: 1px solid var(--border); border-radius: 14px; padding: 12px;
    box-shadow: 0 18px 45px rgba(0,0,0,0.5); z-index: 250;
  }
  .account-name { font-family: var(--font-heading); font-size: 14px; font-weight: 800; margin-bottom: 3px; }
  .account-email { color: var(--muted); font-size: 12px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .account-popover button {
    width: 100%; border: 1px solid #7f1d1d; background: #2a1010; color: var(--red);
    border-radius: 10px; padding: 9px 12px; font-size: 13px; font-weight: 700; cursor: pointer;
  }

  /* ── CUSTOMER LAYOUT ── */
  .navbar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
    width: calc(100% - 32px); max-width: 388px; height: var(--nav-h);
    background: rgba(20,20,20,0.85); backdrop-filter: blur(16px);
    border-radius: 16px; z-index: 100; display: flex; align-items: center;
    border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .nav-inner { width: 100%; display: flex; align-items: center; padding: 0 16px; }
  .nav-logo { font-family: var(--font-heading); font-weight: 800; font-size: 24px; line-height: 1; }
  .logo-k { color: var(--orange); }
  .logo-ivo { color: #ffffff; }
  .nav-actions { display: flex; gap: 8px; }
  .nav-icon-btn {
    width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--border);
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; position: relative; box-shadow: var(--shadow-sm); color: #fff;
  }
  .cart-badge {
    position: absolute; top: -4px; right: -4px;
    background: var(--orange); color: white; font-size: 10px; font-weight: 700;
    width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .nav-back {
    width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border);
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: var(--shadow-sm); color: #fff;
  }
  .nav-title { font-family: var(--font-heading); font-weight: 700; font-size: 17px; color: #fff; }

  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; height: calc(var(--bot-h) + var(--sab));
    padding-bottom: var(--sab); background: rgba(15,15,15,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid var(--border); z-index: 100; display: flex; align-items: flex-start;
  }
  .bottom-nav-v2 {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    width: calc(100% - 32px); max-width: 388px; background: #121212;
    border-radius: 20px; display: flex; align-items: center; height: 68px; z-index: 100;
    border: 1px solid #222; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .bnv2-tab {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 10px 0; font-size: 10px; font-weight: 500; color: var(--on-surface-faint);
    font-family: var(--font-body); transition: color 0.15s;
  }
  .bnv2-tab.active { color: var(--orange); }
  .bnv2-fab {
    width: 52px; height: 52px; border-radius: 50%; background: var(--orange);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(229,57,53,0.45); position: relative; margin-bottom: 14px;
  }

  .main-content {
    padding-top: var(--nav-total);
    padding-bottom: calc(var(--bot-h) + var(--sab));
    min-height: 100svh; 
    height: 100svh; 
    overflow-y: auto; 
    background: #000000; /* Force pure black canvas */
    color: #ffffff;      /* Ensure text defaults to crisp white */
  }
  
  /* Clear out any white radial gradients that fight the black layout */
  .main-content.screen-home {
    padding-top: 0;
    padding-bottom: calc(92px + var(--sab));
    background: #000000;
  }
  .page { padding: 0; padding-bottom: 100px; }
  .screen-shell { padding: 16px 16px 24px; display: flex; flex-direction: column; gap: 12px; }
  .screen-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 18px;
    box-shadow: var(--shadow-sm); padding: 14px 16px;
  }

  /* ── HOME ── */
  .home-hero { background: var(--surface); padding: 16px; position: relative; overflow: hidden; }
  .search-bar { background: #1a1a1a; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; padding: 12px 14px; gap: 10px; }
  .categories-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .categories-scroll::-webkit-scrollbar { display: none; }
  .cat-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--card); white-space: nowrap; cursor: pointer; font-size: 13px; font-weight: 500; color: #fff; transition: all 0.2s; }
  .cat-pill.active { background: var(--orange); border-color: var(--orange); color: white; }
  
  .popular-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .popular-card { background: var(--card); border-radius: var(--radius); padding: 14px; width: 160px; flex-shrink: 0; cursor: pointer; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  .popular-name { font-weight: 600; font-size: 13px; margin-bottom: 2px; color: #fff; }
  .popular-vendor { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .popular-price { font-weight: 700; color: var(--orange); font-size: 14px; }

  .hv2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .hv2-card { background: var(--surface); border-radius: 16px; border: 1px solid var(--line); box-shadow: 0 2px 12px rgba(0,0,0,0.4); cursor: pointer; overflow: hidden; }
  .hv2-card-img { height: 124px; background: linear-gradient(135deg, var(--chip-bg) 0%, var(--surface-alt) 100%); }
  .hv2-card-name { font-weight: 700; font-size: 13.5px; color: var(--on-surface); }
  .hv2-card-cat { font-size: 12px; color: var(--on-surface-muted); }

  /* ── VENDOR DASHBOARD ── */
  .vd-header { background: var(--surface); padding: calc(16px + var(--sat)) 16px 16px; }
  .vd-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .vd-logo { font-family: var(--font-heading); font-weight: 800; font-size: 20px; color: #fff; }
  .vd-logo span { color: var(--orange); font-weight: 700; }
  .vendor-badge { display: flex; align-items: center; gap: 6px; background: var(--card); border: 1px solid var(--border); border-radius: 100px; padding: 7px 14px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
  .online-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
  .dashboard-surface { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow-sm); }
  .dashboard-surface .label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--orange); margin-bottom: 6px; }
  .dashboard-surface .title { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .dashboard-surface .copy { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .vd-tabs { display: flex; gap: 8px; background: var(--card); padding: 4px; border-radius: 14px; border: 1px solid var(--border); }
  .vd-tab { flex: 1; border: none; background: transparent; color: var(--muted); font-size: 13px; font-weight: 600; padding: 9px 0; border-radius: 11px; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .vd-tab.active { background: var(--orange); color: #fff; }

  .vd-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 100px; background: var(--surface); min-height: 100svh; color: #fff; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-card { background: var(--card); border-radius: 10px; border: 1px solid var(--border); padding: 14px; }
  .stat-label { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 700; font-family: var(--font-heading); }

  .empty-orders { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--muted); text-align: center; gap: 8px; }
  .empty-orders .emoji { font-size: 32px; }

  .vorder-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm); }
  .vorder-card-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px; gap: 10px; }
  .vorder-card-id { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px; }
  .vorder-card-customer { font-size: 13px; color: var(--muted); margin-bottom: 2px; }
  .vorder-card-time { font-size: 12px; color: var(--muted); }
  .vorder-card-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-top: 1px solid var(--border); }

  .vorder-status-pill { font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 100px; white-space: nowrap; }
  .vpill-ready { background: var(--green-soft); color: var(--green); }
  .vpill-pending { background: rgba(245, 158, 11, 0.18); color: var(--yellow); }
  .vpill-cancel { background: var(--red-soft); color: var(--red); }

  .action-btns { display: flex; gap: 8px; }
  .btn-accept, .btn-reject { border: none; border-radius: 100px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .btn-accept { background: var(--orange); color: #fff; }
  .btn-reject { background: var(--card); color: var(--muted); border: 1px solid var(--border); }
  
  /* ── SUCCESS MODAL ── */
  .success-modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(15,15,15,0.75); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .success-modal-card { background: var(--card); border-radius: 22px; padding: 32px 24px 24px; max-width: 320px; width: 100%; text-align: center; border: 1px solid #222; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .success-modal-title { font-family: var(--font-heading); font-weight: 800; font-size: 21px; color: var(--orange); margin-bottom: 8px; }
  .success-modal-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; box-shadow: 0 8px 20px rgba(229,57,53,0.35); }
  .success-modal-text { font-size: 13px; color: var(--on-surface-muted); line-height: 1.6; margin-bottom: 22px; }
  .success-modal-btn { width: 100%; background: var(--orange); border: none; border-radius: 14px; padding: 14px; color: #ffffff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: var(--font-body); box-shadow: 0 6px 16px rgba(229,57,53,0.3); transition: transform 0.15s; }
  .success-modal-btn:active { transform: scale(0.97); }

  /* ── PROFILE V2 ── */
  .pv2-banner { background: linear-gradient(135deg, #d32f2f 0%, #e53935 60%, #b71c1c 100%); height: calc(150px + var(--sat)); border-radius: 0 0 32px 32px; position: relative; }
  .pv2-avatar { width: 96px; height: 96px; border-radius: 24px; background: var(--surface-soft); border: 4px solid var(--border); position: absolute; left: 50%; bottom: -48px; transform: translateX(-50%); color: var(--orange); font-family: var(--font-heading); font-weight: 800; font-size: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .pv2-card { padding: 64px 20px 0; background: var(--surface); }
  .pv2-input { width: 100%; background: var(--surface-alt); border: 1.5px solid var(--line); border-radius: 12px; padding: 12px 14px; font-size: 14px; color: var(--on-surface); outline: none; }
  .pv2-input:focus { border-color: var(--orange); background: var(--surface-alt); }

  /* ── CART V2 ── */
  .cv2-summary { background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 14px; padding: 14px 16px; }
  .cv2-pay-opt { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1.5px solid var(--line); border-radius: 14px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; }
  .cv2-pay-opt.active { border-color: var(--orange); background: var(--chip-bg); }
  .cv2-bottom-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; background: var(--surface); border-top: 1px solid var(--line); padding: 14px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 -4px 20px rgba(0,0,0,0.4); z-index: 90; }

  /* ── TOAST ── */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #fff; color: #000; padding: 10px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; z-index: 999; }

  /* ── DARK MODE FALLBACK BACKWARDS COMPATIBILITY ── */
  [data-theme="dark"] {
    --card: #1c1c1e; --bg: #000000; --border: #222222; --text: #ffffff;
  }
  /* Neutralize global layout spacers specifically for your clean sub-pages */
  .main-content:has(.cart-v2),
  .main-content:has(.orders-v2),
  .main-content:has(.vendor-page) {
    padding-top: 0 !important;
    margin-top: 0 !important;
  }

  /* Ensure the wrapper respects absolute zero boundaries */
  .cart-v2, .orders-v2 {
    margin-top: 0 !important;
    padding-top: calc(var(--sat) + 24px) !important; /* Flat pristine padding below browser bar, plus safe-area for PWA standalone */
  }
  .vendor-page {
    margin-top: 0 !important; /* main-content's padding-top is already killed above, so no negative margin needed */
  }
    /* Eradicates any dark-gray themes left over in global sheets for sub-pages */
  .profile-page, .screen-card-soft {
    background: #000000 !important;
    background-color: #000000 !important;
  }
    /* ==========================================================================
   PREMIUM DARK-MODE RECOVERY OVERRIDES
   ========================================================================== */

/* 1. Force Absolute True Black Background Canvas */
body, 
.page, 
.vendor-page, 
.cart-v2, 
.orders-v2, 
.profile-page {
  background: #000000 !important;
  background-color: #000000 !important;
  color: #ffffff !important;
}

/* 2. Style Component Headers and Navigation Bars Flush Dark */
.vendor-hero,
.ov2-header,
.navbar,
.global-header {
  background: #000000 !important;
  background-color: #000000 !important;
  border-color: #141414 !important;
}

/* 3. Modernize Typography to use Google Font Variables Globally */
body, input, textarea, button, p, span {
  font-family: var(--font-body, 'DM Sans', sans-serif) !important;
}

h1, h2, h3, h4, h5, h6, .nav-title, .ov2-title {
  font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif) !important;
  font-weight: 800 !important;
}

/* 4. Overhaul Cards to be Dark Translucent Blocks instead of Light Cards */
.menu-item, 
.review-card, 
.ov2-card, 
.screen-card-soft,
.cv2-summary {
  background: #121212 !important;
  background-color: #121212 !important;
  border: 1px solid #222222 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

/* 5. Cleanup Form Inputs and Placeholders */
.pv2-input, 
.form-input, 
input[type="text"], 
input[type="tel"], 
textarea {
  background: #121212 !important;
  background-color: #121212 !important;
  border: 1px solid #222222 !important;
  color: #ffffff !important;
}

input::placeholder, textarea::placeholder {
  color: #666666 !important;
}

/* 6. Enforce High-Contrast Muted Subtext Labels */
p, span, .review-time, .review-text, .ov2-card-meta {
  color: #a0a0a0;
}

/* 7. Strip out any remaining Box Shadows or Old Badges */
.popular-badge {
  box-shadow: none !important;
}
`;

export default CSS;