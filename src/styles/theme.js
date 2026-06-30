// src/styles/theme.js

export const theme = {
  colors: {
    brand: "#ef3636",       // The vibrant Kivo red
    textMain: "#2d2624",    // Deep charcoal for crisp typography
    textMuted: "#a0958a",   // Warm gray for subtitles and captions
    bgPage: "white",        // Clean container backing
    bgField: "#f8f7f5",     // Light tint for inputs and tags
    border: "#f5f3f0",      // Soft separator outline
  },
  
  // Reusable inline style snippets to avoid typing layout logic repeatedly
  pwaContainer: {
    background: "white",
    minHeight: "100vh",
    paddingTop: "calc(var(--sat) + 16px)", // Safe area top (status bar)
    paddingBottom: "calc(var(--sab) + 80px)", // Safe area bottom (nav bar)
    paddingLeft: "16px",
    paddingRight: "16px",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  }
};