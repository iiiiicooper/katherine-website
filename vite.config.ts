import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { defaultConfig } from "./src/lib/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "dev-api-config",
      configureServer(server) {
        // 内存存储，避免 Node 类型依赖；适用于本地开发
        let devConfig: any = null;
        function sendJson(res: any, obj: unknown, status = 200) {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        }
        server.middlewares.use(async (req: any, res: any, next: any) => {
          const url = String(req?.url ?? "");
          const method = String(req?.method ?? "GET");
          if (!url) return next();
          if (!url.startsWith("/api/config")) return next();
          if (method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          try {
            if (method === "GET") {
              sendJson(res, { ok: true, data: devConfig ?? defaultConfig });
              return;
            }
            if (method === "PUT") {
              let bodyText = "";
              req.on("data", (c: any) => {
                try {
                  bodyText += typeof c === "string" ? c : String(c);
                } catch {
                  bodyText += "";
                }
              });
              req.on("end", () => {
                try {
                  devConfig = JSON.parse(bodyText);
                } catch {
                  sendJson(res, { ok: false, error: "invalid_json" }, 400);
                  return;
                }
                sendJson(res, { ok: true });
              });
              return;
            }
            sendJson(res, { ok: false, error: "method_not_allowed" }, 405);
          } catch (err) {
            sendJson(res, { ok: false, error: "server_error", detail: String(err) }, 500);
          }
        });
      },
    },
  ],
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
});
