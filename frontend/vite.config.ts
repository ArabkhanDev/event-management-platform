import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // sockjs-client (used by @stomp/stompjs) references the Node-style
  // `global` object, which isn't defined in a browser/Vite context.
  define: {
    global: "globalThis",
  },
  server: {
    port: 5173,
  },
});
