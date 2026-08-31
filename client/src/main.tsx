import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "./lib/pwa";
import { requestPersistence } from "./lib/backup";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

registerSW();

// Ať iOS nesmaže data jen proto, že jsi appku týden neotevřel.
void requestPersistence();
