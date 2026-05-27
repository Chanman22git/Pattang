import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* HashRouter so GitHub Pages doesn't need server-side rewrites. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
