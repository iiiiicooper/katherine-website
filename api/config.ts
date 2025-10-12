export const config = { runtime: "edge" };

import { put, list } from "@vercel/blob";
import { defaultConfig } from "../src/lib/config";

const token: string | undefined =
  (globalThis as any)?.process?.env?.BLOB_READ_WRITE_TOKEN ?? (globalThis as any)?.BLOB_READ_WRITE_TOKEN;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function putJsonPrivate(path: string, json: string) {
  return put(path, json, {
    contentType: "application/json",
    access: "private" as any,
    addRandomSuffix: false,
    token,
  } as any);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      // load current config (gracefully fall back if Blob not available)
      try {
        const items = await list({ prefix: "config/", token });
        const current = items.blobs.find((b) => b.pathname === "config/current.json");
        if (current) {
          const url = (current as any).downloadUrl ?? current.url;
          const r = await fetch(url);
          if (r.ok) {
            const json = await r.text();
            return jsonResponse({ ok: true, data: JSON.parse(json) });
          }
        }
      } catch {
        // ignore Blob errors and fall back to default
      }
      // fallback to default
      return jsonResponse({ ok: true, data: defaultConfig });
    }

    if (req.method === "PUT") {
      const bodyText = await req.text();
      // naive validation: must be JSON object
      let parsed: unknown;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        return jsonResponse({ ok: false, error: "invalid_json" }, 400);
      }
      try {
        await putJsonPrivate("config/current.json", bodyText);
        const ts = Date.now();
        await putJsonPrivate(`config/${ts}.json`, bodyText);
      } catch {
        // Blob unavailable: report non-blocking error so frontend can continue
        return jsonResponse({ ok: false, error: "blob_unavailable" }, 503);
      }
      // keep last 3 versions
      try {
        const items = await list({ prefix: "config/", token });
        const versions = items.blobs
          .filter((b) => b.pathname.startsWith("config/") && b.pathname !== "config/current.json")
          .map((b) => ({ path: b.pathname, ts: Number(b.pathname.replace(/^config\/(\d+)\.json$/, "$1")) }))
          .filter((v) => !Number.isNaN(v.ts))
          .sort((a, b) => b.ts - a.ts);
        const keep = versions.slice(0, 3).map((v) => v.path);
        // no deletion here to simplify; Vercel Blob API requires del, which we can add later
        // respond OK
      } catch {
        // ignore
      }
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  } catch (err) {
    return jsonResponse({ ok: false, error: "server_error", detail: String(err) }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}