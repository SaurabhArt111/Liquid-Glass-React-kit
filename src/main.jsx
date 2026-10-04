import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./demo/App.jsx";
import { startLiquidFavicon } from "./liquid-glass";
import "./demo/demo.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// the tab icon is liquid glass too: two lenses melting together and splitting apart (pauses when the tab is hidden)
startLiquidFavicon();
