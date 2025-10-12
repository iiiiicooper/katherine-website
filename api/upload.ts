export const runtime = 'nodejs';

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
    const canFormData = typeof (req as any).formData === "function";
    let file: File | null = null;
    let prefix = "uploads/";
    let filename: string | null = null;
    let contentType: string | undefined = undefined;

    if (canFormData) {
      const form = await (req as any).formData();
      file = form.get("file") as File | null;
      prefix = (form.get("prefix") as string | null) || "uploads/";
      contentType = file?.type || undefined;
      filename = file?.name || null;
    } else {
      // Node runtime: parse query for filename/prefix and read raw body
      const url = new URL(req.url, "http://localhost");
      filename = url.searchParams.get("filename");
      prefix = url.searchParams.get("prefix") || "uploads/";
    }

    // Size limit check
    const maxBytes = 10 * 1024 * 1024; // 10MB
    let key = "";
    let bodyForUpload: BodyInit;

    if (file) {
      if (file.size > maxBytes) {
        return json({ error: "file_too_large", detail: "max 10MB" }, 413);
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      key = `${prefix}${Date.now()}_${safeName}`;
      bodyForUpload = file;
    } else {
      const buf = await req.arrayBuffer();
      if (!buf || buf.byteLength === 0) {
        return json({ error: "empty_body" }, 400);
      }
      if (buf.byteLength > maxBytes) {
        return json({ error: "file_too_large", detail: "max 10MB" }, 413);
      }
      const safeName = (filename || `upload_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
      key = `${prefix}${Date.now()}_${safeName}`;
      bodyForUpload = Buffer.from(buf);
    }

    try {
      if (!token) throw new Error("missing_token");
      const uploadUrl = `https://blob.vercel-storage.com/${encodeURIComponent(key)}?access=public&addRandomSuffix=false`;
      const r = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType || "application/octet-stream",
          // cache up to one year for public assets
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: bodyForUpload,
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