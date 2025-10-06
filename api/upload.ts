import { put } from "@vercel/blob";

export const config = { runtime: "nodejs" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const token: string | undefined =
  (globalThis as any)?.process?.env?.BLOB_READ_WRITE_TOKEN ?? (globalThis as any)?.BLOB_READ_WRITE_TOKEN;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const prefix = (form.get("prefix") as string | null) || "uploads/";

    if (!file) {
      return json({ error: "file field is required" }, 400);
    }

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      return json({ error: "file_too_large", detail: "max 10MB" }, 413);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${prefix}${Date.now()}_${safeName}`;

    const { url, pathname } = await put(
      key,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type || undefined,
        cacheControlMaxAge: 31536000,
        token,
      } as any
    );

    return json({ url, pathname }, 200);
  } catch (err: any) {
    console.error("/api/upload error", err);
    return json({ error: "upload_failed", detail: String(err?.message || err) }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}