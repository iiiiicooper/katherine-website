export const runtime = 'edge';

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

    try {
      if (!token) throw new Error("missing_token");
      const uploadUrl = `https://blob.vercel-storage.com/${encodeURIComponent(key)}?access=public&addRandomSuffix=false`;
      const r = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "application/octet-stream",
          // cache up to one year for public assets
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: file,
      });
      if (!r.ok) throw new Error(`upload_failed_${r.status}`);
      const data = await r.json();
      const url = data.url || data.downloadUrl || null;
      const pathname = data.pathname || null;
      if (!url || !pathname) throw new Error("invalid_response");
      return json({ url, pathname }, 200);
    } catch (e) {
      // Blob unavailable or upload failed: return placeholder to trigger base64 fallback in UI
      return json({ url: "/screen.png", pathname: "/screen.png" }, 200);
    }
  } catch (err: any) {
    console.error("/api/upload error", err);
    // Return placeholder to avoid breaking frontend. It will use base64 fallback.
    return json({ url: "/screen.png", pathname: "/screen.png" }, 200);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}