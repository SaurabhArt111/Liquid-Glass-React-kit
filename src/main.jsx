import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import App from "./site/App.jsx";
import { startLiquidFavicon } from "./liquid-glass";
import "./site/site.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// the tab icon is liquid glass too (pauses when the tab is hidden)
startLiquidFavicon();
