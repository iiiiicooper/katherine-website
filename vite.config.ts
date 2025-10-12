import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { defaultConfig } from "./src/lib/config";
import * as fs from "node:fs";
import * as path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "dev-api-config",
      configureServer(server) {
        // 本地文件持久化，避免刷新/重启后丢失
        const dataDir = path.join(process.cwd(), "data");
        const cfgFile = path.join(dataDir, "app-config.json");
        function readConfigFile(): any {
          try {
            if (fs.existsSync(cfgFile)) {
              const txt = fs.readFileSync(cfgFile, "utf-8");
              return JSON.parse(txt);
            }
          } catch {}
          return null;
        }
        function writeConfigFile(jsonText: string): void {
          try {
            fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(cfgFile, jsonText, "utf-8");
          } catch {}
        }
        let devMessages: any[] = [];
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
              const fileCfg = readConfigFile();
              sendJson(res, { ok: true, data: fileCfg ?? defaultConfig });
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
                  const _parsed = JSON.parse(bodyText);
                } catch {
                  sendJson(res, { ok: false, error: "invalid_json" }, 400);
                  return;
                }
                // 写入本地文件以持久化
                writeConfigFile(bodyText);
                sendJson(res, { ok: true });
              });
              return;
            }
            sendJson(res, { ok: false, error: "method_not_allowed" }, 405);
          } catch (err) {
            sendJson(res, { ok: false, error: "server_error", detail: String(err) }, 500);
          }
        });

        // 开发环境 /api/messages 简易实现（内存存储）
        server.middlewares.use(async (req: any, res: any, next: any) => {
          const url = String(req?.url ?? "");
          const method = String(req?.method ?? "GET");
          if (!url || !url.startsWith("/api/messages")) return next();
          if (method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          // 避免依赖全局 URL：手写查询参数解析
          function getQueryParam(href: string, key: string): string | null {
            const i = href.indexOf("?");
            if (i < 0) return null;
            const qs = href.slice(i + 1);
            for (const part of qs.split("&")) {
              const [k, v] = part.split("=");
              if (decodeURIComponent(k || "") === key) {
                return decodeURIComponent(v || "");
              }
            }
            return null;
          }
          const id = getQueryParam(url, "id");
          function readBody(): Promise<any> {
            return new Promise((resolve) => {
              let bodyText = "";
              req.on("data", (c: any) => {
                try { bodyText += typeof c === "string" ? c : String(c); } catch { bodyText += ""; }
              });
              req.on("end", () => {
                try { resolve(JSON.parse(bodyText || "{}")); } catch { resolve({}); }
              });
            });
          }
          try {
            if (method === "GET") {
              sendJson(res, { ok: true, data: devMessages });
              return;
            }
            if (method === "POST") {
              const body = await readBody();
              if (!body?.name || !body?.email || !body?.content) {
                sendJson(res, { ok: false, error: "missing_fields" }, 400);
                return;
              }
              const msg = {
                id: `m${Date.now()}`,
                name: String(body.name),
                email: String(body.email),
                content: String(body.content),
                createdAt: new Date().toISOString(),
                preferredChannel: body.preferredChannel,
                status: "unread",
              };
              devMessages.push(msg);
              sendJson(res, { ok: true, data: msg }, 201);
              return;
            }
            if (method === "PATCH") {
              if (!id) { sendJson(res, { ok: false, error: "missing_id" }, 400); return; }
              const body = await readBody();
              const idx = devMessages.findIndex((m) => m.id === id);
              if (idx < 0) { sendJson(res, { ok: false, error: "not_found" }, 404); return; }
              devMessages[idx] = { ...devMessages[idx], ...body };
              sendJson(res, { ok: true, data: devMessages[idx] });
              return;
            }
            if (method === "DELETE") {
              if (!id) { sendJson(res, { ok: false, error: "missing_id" }, 400); return; }
              devMessages = devMessages.filter((m) => m.id !== id);
              sendJson(res, { ok: true });
              return;
            }
            sendJson(res, { ok: false, error: "method_not_allowed" }, 405);
          } catch (err) {
            sendJson(res, { ok: false, error: "server_error", detail: String(err) }, 500);
          }
        });

        // 开发环境 /api/upload 简易实现（返回占位 URL）
        server.middlewares.use(async (req: any, res: any, next: any) => {
          const url = String(req?.url ?? "");
          const method = String(req?.method ?? "GET");
          if (!url || !url.startsWith("/api/upload")) return next();
          if (method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          try {
            if (method !== "POST") {
              sendJson(res, { error: "method_not_allowed" }, 405);
              return;
            }
            // 读取原始请求体
            function readRawBody(): Promise<Buffer> {
              return new Promise((resolve) => {
                const chunks: Buffer[] = [];
                req.on("data", (c: any) => {
                  try { chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))); } catch {}
                });
                req.on("end", () => resolve(Buffer.concat(chunks)));
              });
            }
            function getQueryParam(href: string, key: string): string | null {
              const i = href.indexOf("?");
              if (i < 0) return null;
              const qs = href.slice(i + 1);
              for (const part of qs.split("&")) {
                const [k, v] = part.split("=");
                if (decodeURIComponent(k || "") === key) {
                  return decodeURIComponent(v || "");
                }
              }
              return null;
            }
            function sanitizeFilename(name: string): string {
              return name.replace(/[^a-zA-Z0-9._-]/g, "_");
            }
            const contentType = String(req.headers["content-type"] || "");
            const prefixQS = getQueryParam(url, "prefix") || "";
            const prefix = prefixQS.replace(/[^a-zA-Z0-9/_-]/g, "");
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

            const raw = await readRawBody();

            // 支持两种方式：multipart/form-data 与 octet-stream
            if (/multipart\/form-data/i.test(contentType)) {
              const m = contentType.match(/boundary=(.*)$/i);
              const boundary = m ? m[1] : "";
              if (!boundary) {
                sendJson(res, { error: "missing_boundary" }, 400);
                return;
              }
              const boundaryBuf = Buffer.from(`--${boundary}`);
              const parts = raw.toString("binary").split(boundaryBuf.toString("binary"));
              let savedPath: string | null = null;
              for (const part of parts) {
                // 跳过结束
                if (part.includes("--\r\n")) continue;
                const headerEnd = part.indexOf("\r\n\r\n");
                if (headerEnd < 0) continue;
                const header = part.slice(0, headerEnd);
                const bodyBinary = part.slice(headerEnd + 4);
                const dispMatch = header.match(/Content-Disposition:.*name="([^"]+)";\s*filename="([^"]*)"/i);
                if (!dispMatch) continue;
                const fieldName = dispMatch[1];
                const fileNameRaw = dispMatch[2] || `file_${Date.now()}`;
                if (fieldName !== "file") continue;
                const fileName = sanitizeFilename(fileNameRaw);
                const ts = Date.now();
                const relDir = prefix ? prefix.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "") : "";
                const saveDir = path.join(uploadDir, relDir);
                try { fs.mkdirSync(saveDir, { recursive: true }); } catch {}
                // 优先使用原始文件名；若已存在则加时间戳后缀
                const extIdx = fileName.lastIndexOf(".");
                const base = extIdx > 0 ? fileName.slice(0, extIdx) : fileName;
                const ext = extIdx > 0 ? fileName.slice(extIdx) : "";
                let finalName = `${base}${ext}`;
                let savePath = path.join(saveDir, finalName);
                if (fs.existsSync(savePath)) {
                  finalName = `${base}-${ts}${ext}`;
                  savePath = path.join(saveDir, finalName);
                }
                // 将二进制内容写入文件（转换为 Buffer）
                const fileBuf = Buffer.from(bodyBinary, "binary");
                fs.writeFileSync(savePath, fileBuf);
                const publicRel = path.join("/uploads", relDir, finalName).replace(/\\/g, "/");
                savedPath = publicRel;
                break;
              }
              if (!savedPath) {
                sendJson(res, { error: "no_file" }, 400);
                return;
              }
              sendJson(res, { url: savedPath, pathname: savedPath }, 200);
              return;
            } else {
              // application/octet-stream 或其他：从查询参数拿文件名
              const filenameQS = getQueryParam(url, "filename") || `file_${Date.now()}`;
              const fileName = sanitizeFilename(filenameQS);
              const ts = Date.now();
              const relDir = prefix ? prefix.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "") : "";
              const saveDir = path.join(uploadDir, relDir);
              try { fs.mkdirSync(saveDir, { recursive: true }); } catch {}
              const finalName = `${ts}_${fileName}`;
              const savePath = path.join(saveDir, finalName);
              fs.writeFileSync(savePath, raw);
              const publicRel = path.join("/uploads", relDir, finalName).replace(/\\/g, "/");
              sendJson(res, { url: publicRel, pathname: publicRel }, 200);
              return;
            }
          } catch (err) {
            sendJson(res, { error: "upload_failed", detail: String(err) }, 500);
          }
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
});
