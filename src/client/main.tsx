import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles.css";

// Agent/touch mode: bigger tap targets, no hover-only affordances (design § dual-mode).
const params = new URLSearchParams(location.search);
if (params.has("agent") || params.get("mode") === "agent") {
  document.documentElement.setAttribute("data-agent", "true");
}

createRoot(document.getElementById("app")!).render(<App />);
