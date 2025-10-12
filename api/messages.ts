export const config = { runtime: "edge" };

type Status = "unread" | "replied";
type Message = {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  preferredChannel?: "email" | "phone" | "linkedin";
  status?: Status;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

import { put, list, del } from "@vercel/blob";

const token: string | undefined =
  (globalThis as any)?.process?.env?.BLOB_READ_WRITE_TOKEN ?? (globalThis as any)?.BLOB_READ_WRITE_TOKEN;

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

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (req.method === "GET") {
      try {
        const items = await list({ prefix: "messages/", token });
        const results: Message[] = [];
        for (const item of items.blobs) {
          try {
            const url = (item as any).downloadUrl ?? item.url;
            const r = await fetch(url);
            if (r.ok) {
              const m = (await r.json()) as Message;
              results.push(m);
            }
          } catch {
            // skip
          }
        }
        return json({ ok: true, data: results });
      } catch {
        // Blob unavailable: return empty list gracefully
        return json({ ok: true, data: [] });
      }
    }

    if (req.method === "POST") {
      const body = (await req.json()) as Partial<Message>;
      if (!body.name || !body.email || !body.content) {
        return json({ ok: false, error: "missing_fields" }, 400);
      }
      const msg: Message = {
        id: `m${Date.now()}`,
        name: String(body.name),
        email: String(body.email),
        content: String(body.content),
        createdAt: new Date().toISOString(),
        preferredChannel: body.preferredChannel as any,
        status: "unread",
      };
      try {
        await putJsonPrivate(`messages/${msg.id}.json`, JSON.stringify(msg));
        return json({ ok: true, data: msg }, 201);
      } catch {
        return json({ ok: false, error: "blob_unavailable" }, 503);
      }
    }

    if (req.method === "PATCH") {
      if (!id) return json({ ok: false, error: "missing_id" }, 400);
      // load existing
      // 通过列表查找现有 blob
      try {
        const items = await list({ prefix: "messages/", token });
        const item = items.blobs.find((b) => b.pathname === `messages/${id}.json`);
        if (!item) return json({ ok: false, error: "not_found" }, 404);
        const currentUrl = (item as any).downloadUrl ?? item.url;
        const currentRes = await fetch(currentUrl);
        if (!currentRes.ok) return json({ ok: false, error: "load_failed" }, 500);
        const current = (await currentRes.json()) as Message;
        const patch = (await req.json()) as Partial<Message>;
        const next: Message = { ...current, ...patch };
        await putJsonPrivate(`messages/${id}.json`, JSON.stringify(next));
        return json({ ok: true, data: next });
      } catch {
        return json({ ok: false, error: "blob_unavailable" }, 503);
      }
    }

    if (req.method === "DELETE") {
      if (!id) return json({ ok: false, error: "missing_id" }, 400);
      try {
        await del(`messages/${id}.json`, { token });
        return json({ ok: true });
      } catch {
        return json({ ok: false, error: "blob_unavailable" }, 503);
      }
    }

    return json({ ok: false, error: "method_not_allowed" }, 405);
  } catch (err) {
    return json({ ok: false, error: "server_error", detail: String(err) }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}