/** @type {import('tailwindcss').Config} */
// Vakil Chambers tokens — see design-handoff/.../DESIGN_SYSTEM.md.
// Keep this in lockstep with the .vc-* utility classes in src/index.css;
// both are the canonical surface for the redesign.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bar coat black + its body and meta variants.
        ink: {
          DEFAULT: "#1A1F2E",
          2: "#6B6358", // Ink wash — body
          3: "#A8956F", // Court fee stamp — meta
          // Back-compat: keep older class names working for the Phase 0
          // screens that haven't been redesigned yet (Templates list,
          // Research, Calendar, Translate, New Document, sign-in).
          muted: "#6B6358",
        },
        // Back-compat alias — old "accent" maroon → new "brass". Old screens
        // stay visually close to the new system instead of jarring against it.
        accent: "#B8862F",
        paper: "#FFFFFF",
        foolscap: "#FAF8F3", // cards, surfaces
        teak: "#5A3A1F", // strong borders / dividers
        brass: {
          DEFAULT: "#B8862F", // Ashoka brass
          soft: "#EDDFBE", // brass tint
        },
        seal: {
          DEFAULT: "#4A1818", // Sindoor seal — urgent
          soft: "#EAD9D9",
        },
        lawn: {
          DEFAULT: "#2D4A3E", // Court lawn — success
          soft: "#D8E2DD",
        },
        twine: {
          DEFAULT: "#8B6F47", // tags
          soft: "rgba(139,111,71,0.18)",
        },
        // Derived rule colors — Teak bench at low opacity.
        rule: "rgba(90,58,31,0.55)",
        "rule-soft": "rgba(90,58,31,0.18)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
        lg: "4px",
      },
      fontFamily: {
        serif: ["Spectral", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
