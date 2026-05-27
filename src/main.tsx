import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// BrowserRouter (clean URLs) + basename=BASE_URL so the same code works in
// dev ("/") and on GitHub Pages ("/Pattang/"). The deploy workflow copies
// index.html → 404.html so deep links survive Pages's lack of rewrites.
// We moved off HashRouter because magic-link auth uses the URL fragment.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
